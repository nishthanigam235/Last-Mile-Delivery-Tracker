const Order = require('../models/Order');
const User = require('../models/User');
const pricingService = require('../services/pricingService');
const assignmentService = require('../services/assignmentService');
const notificationService = require('../services/notificationService');

/**
 * @desc Pre-calculate delivery charges preview
 * @route POST /api/orders/calculate
 * @access Private
 */
exports.calculatePreview = async (req, res) => {
  try {
    const {
      pickupPincode,
      dropPincode,
      length,
      breadth,
      height,
      actualWeight,
      orderType,
      paymentType,
    } = req.body;

    const pricing = await pricingService.calculateCharges({
      pickupPincode,
      dropPincode,
      length,
      breadth,
      height,
      actualWeight,
      orderType,
      paymentType,
    });

    res.status(200).json({ success: true, data: pricing });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc Create a new order
 * @route POST /api/orders
 * @access Private (Customer & Admin)
 */
exports.createOrder = async (req, res) => {
  try {
    const {
      customer, // Admin can override customer ID
      pickupAddress,
      pickupPincode,
      dropAddress,
      dropPincode,
      length,
      breadth,
      height,
      actualWeight,
      orderType,
      paymentType,
    } = req.body;

    // Resolve customer ID
    let targetCustomerId = req.user.id;
    if (req.user.role === 'admin' && customer) {
      targetCustomerId = customer;
      // Verify if customer exists
      const custExists = await User.findById(customer);
      if (!custExists || custExists.role !== 'customer') {
        return res.status(400).json({ success: false, message: 'Invalid customer account selected' });
      }
    }

    // Call pricing service to perform validations and calculate weights / fees
    const pricing = await pricingService.calculateCharges({
      pickupPincode,
      dropPincode,
      length,
      breadth,
      height,
      actualWeight,
      orderType,
      paymentType,
    });

    // Create the order
    const order = new Order({
      customer: targetCustomerId,
      pickupAddress,
      pickupPincode,
      pickupZone: pricing.pickupZone._id,
      dropAddress,
      dropPincode,
      dropZone: pricing.dropZone._id,
      packageDimensions: { length, breadth, height },
      actualWeight,
      volumetricWeight: pricing.volumetricWeight,
      billableWeight: pricing.billableWeight,
      orderType,
      paymentType,
      deliveryCharge: pricing.deliveryCharge,
      status: 'Created',
    });

    // Append first tracking history entry
    order.trackingHistory.push({
      status: 'Created',
      updatedBy: req.user.id,
      remarks: 'Order submitted and confirmed',
    });

    await order.save();

    // Populate customer to send notifications
    await order.populate('customer');

    // Notify customer
    await notificationService.notifyOrderStatusChange(order, 'Created');

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get all orders (filtered based on roles)
 * @route GET /api/orders
 * @access Private
 */
exports.getOrders = async (req, res) => {
  try {
    const filter = {};

    // 1. Role boundaries
    if (req.user.role === 'customer') {
      filter.customer = req.user.id;
    } else if (req.user.role === 'delivery_agent') {
      filter.assignedAgent = req.user.id;
    }

    // 2. Query filters (Admin only can filter by arbitrary agent, customer, or zone)
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.user.role === 'admin') {
      if (req.query.agent) {
        filter.assignedAgent = req.query.agent;
      }
      if (req.query.customer) {
        filter.customer = req.query.customer;
      }
      if (req.query.zone) {
        // Match either pickup or drop zone
        filter.$or = [
          { pickupZone: req.query.zone },
          { dropZone: req.query.zone },
        ];
      }
    }

    // 3. Simple Search parameter (matches OrderId, pickup address, drop address, or pincodes)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { orderId: searchRegex },
          { pickupAddress: searchRegex },
          { dropAddress: searchRegex },
          { pickupPincode: searchRegex },
          { dropPincode: searchRegex },
        ],
      });
    }

    const orders = await Order.find(filter)
      .populate('customer', 'name email phone')
      .populate('pickupZone', 'zoneName city')
      .populate('dropZone', 'zoneName city')
      .populate('assignedAgent', 'name phone email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Get single order details and complete tracking timeline
 * @route GET /api/orders/:id
 * @access Private
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email phone')
      .populate('pickupZone', 'zoneName city')
      .populate('dropZone', 'zoneName city')
      .populate('assignedAgent', 'name phone email')
      .populate('trackingHistory.updatedBy', 'name role');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Role-based auth verification
    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this order' });
    }
    if (
      req.user.role === 'delivery_agent' &&
      (!order.assignedAgent || order.assignedAgent._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({ success: false, message: 'Access denied: not assigned to this order' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Update order status with tracking record log
 * @route PUT /api/orders/:id/status
 * @access Private (Agent & Admin)
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Validate status value
    const allowedStatuses = ['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed'];
    if (req.user.role !== 'admin' && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Agents can only transition status to: ${allowedStatuses.join(', ')}`,
      });
    }

    // Verify agent is assigned
    if (req.user.role === 'delivery_agent' && (!order.assignedAgent || order.assignedAgent.toString() !== req.user.id)) {
      return res.status(403).json({ success: false, message: 'Access denied: not assigned to this order' });
    }

    // Update status
    order.status = status;
    if (status === 'Failed' && remarks) {
      order.failReason = remarks;
    }

    // Append to tracking timeline
    order.trackingHistory.push({
      status,
      updatedBy: req.user.id,
      remarks: remarks || `Order status updated to ${status}`,
    });

    await order.save();

    // Populate and send notifications
    await order.populate('customer');
    await notificationService.notifyOrderStatusChange(order, status, remarks);

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Assign delivery agent to order (manual or trigger auto-assign)
 * @route PUT /api/orders/:id/assign-agent
 * @access Private (Admin Only)
 */
exports.assignAgent = async (req, res) => {
  try {
    const { agentId, autoAssign } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (autoAssign) {
      const agent = await assignmentService.autoAssignAgent(order);
      if (!agent) {
        // Log event, but do not crash. Flag assignment lack in tracking
        order.trackingHistory.push({
          status: order.status,
          updatedBy: req.user.id,
          remarks: 'Auto-assignment triggered: No available agent found nearby',
        });
        await order.save();
        return res.status(200).json({
          success: false,
          message: 'No available delivery agent found for assignment. Assigned agent set to null.',
        });
      }

      // Record tracking update
      order.trackingHistory.push({
        status: order.status,
        updatedBy: req.user.id,
        remarks: `Auto-assigned delivery agent: ${agent.name} (${agent.phone})`,
      });
      await order.save();

      return res.status(200).json({
        success: true,
        message: `Auto-assigned agent ${agent.name} successfully`,
        data: order,
      });
    }

    // Manual assignment
    if (!agentId) {
      return res.status(400).json({ success: false, message: 'Please provide an agentId' });
    }

    const agent = await User.findById(agentId);
    if (!agent || agent.role !== 'delivery_agent') {
      return res.status(400).json({ success: false, message: 'Invalid delivery agent ID' });
    }

    order.assignedAgent = agent._id;
    order.trackingHistory.push({
      status: order.status,
      updatedBy: req.user.id,
      remarks: `Manually assigned delivery agent: ${agent.name} (${agent.phone})`,
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Manually assigned agent ${agent.name} successfully`,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc Reschedule a failed delivery
 * @route PUT /api/orders/:id/reschedule
 * @access Private (Customer & Admin)
 */
exports.rescheduleOrder = async (req, res) => {
  try {
    const { rescheduleDate } = req.body;

    if (!rescheduleDate) {
      return res.status(400).json({ success: false, message: 'Please provide a reschedule date' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Enforce role constraints: Customer can only reschedule if it currently is in 'Failed' state
    if (req.user.role === 'customer') {
      if (order.customer.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied: not your order' });
      }
      if (order.status !== 'Failed') {
        return res.status(400).json({ success: false, message: 'Only failed orders can be rescheduled' });
      }
    }

    // Update fields
    order.status = 'Rescheduled';
    order.rescheduleDate = new Date(rescheduleDate);

    // Save tracking history record
    const formattedDate = new Date(rescheduleDate).toLocaleDateString();
    order.trackingHistory.push({
      status: 'Rescheduled',
      updatedBy: req.user.id,
      remarks: `Delivery rescheduled to ${formattedDate}`,
    });

    await order.save();

    // Trigger auto-assignment service again to assign/reassign an agent for the new attempt!
    const assignedAgent = await assignmentService.autoAssignAgent(order);
    if (assignedAgent) {
      order.trackingHistory.push({
        status: 'Rescheduled',
        updatedBy: req.user.id,
        remarks: `Reassigned delivery agent for rescheduled attempt: ${assignedAgent.name}`,
      });
      await order.save();
    } else {
      order.trackingHistory.push({
        status: 'Rescheduled',
        updatedBy: req.user.id,
        remarks: 'Reassigned delivery agent: No agent available at this moment',
      });
      await order.save();
    }

    // Populate customer info
    await order.populate('customer');

    // Notify customer
    await notificationService.notifyOrderStatusChange(order, 'Rescheduled');

    res.status(200).json({ success: true, message: 'Order rescheduled and agent updated', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
