"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const error_handler_js_1 = require("../utils/error.handler.js");
const database_js_1 = require("../config/database.js");
const error_js_1 = require("../middleware/error.js"); // <-- ΔΙΟΡΘΩΣΗ ΤΗΣ ΔΙΑΔΡΟΜΗΣ
const logger_js_1 = require("../utils/logger.js");
class PaymentController {
}
exports.PaymentController = PaymentController;
_a = PaymentController;
/**
 * Create new payment
 */
PaymentController.createPayment = (0, error_js_1.asyncHandler)(async (req, res) => {
    const paymentData = {
        ...req.body,
        createdBy: req.user.id,
        paymentMethod: req.body.paymentMethod,
        status: req.body.status, // <-- ΔΙΟΡΘΩΣΗ ΤΥΠΟΥ
    };
    const payment = await database_js_1.prisma.payment.create({
        data: paymentData,
        include: {
            patient: { select: { id: true, firstName: true, lastName: true } },
            creator: { select: { id: true, firstName: true, lastName: true } },
            treatmentPlan: { select: { id: true, title: true } }
        }
    });
    logger_js_1.logger.info('Payment created', {
        paymentId: payment.id,
        patientId: payment.patientId,
        amount: payment.amount.toString(),
        createdBy: req.user.id,
    });
    res.status(201).json({
        success: true,
        message: 'Payment created successfully',
        data: { payment }
    });
});
/**
 * Get payment by ID
 */
PaymentController.getPaymentById = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const payment = await database_js_1.prisma.payment.findUnique({
        where: { id },
        include: {
            patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            creator: { select: { id: true, firstName: true, lastName: true } },
            treatmentPlan: { select: { id: true, title: true, totalCost: true } }
        }
    });
    if (!payment) {
        throw new error_handler_js_1.NotFoundError('Payment not found');
    }
    res.json({
        success: true,
        message: 'Payment retrieved successfully',
        data: { payment }
    });
});
/**
 * Update payment
 */
PaymentController.updatePayment = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    if (updateData.paymentMethod) {
        updateData.paymentMethod = updateData.paymentMethod;
    }
    if (updateData.status) {
        updateData.status = updateData.status; // <-- ΔΙΟΡΘΩΣΗ ΤΥΠΟΥ
    }
    const updatedPayment = await database_js_1.prisma.payment.update({
        where: { id },
        data: updateData,
        include: {
            patient: { select: { id: true, firstName: true, lastName: true } },
            treatmentPlan: { select: { id: true, title: true } }
        }
    });
    logger_js_1.logger.info('Payment updated', {
        paymentId: id,
        updatedFields: Object.keys(updateData),
        updatedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Payment updated successfully',
        data: { payment: updatedPayment }
    });
});
/**
 * Update payment status
 */
PaymentController.updatePaymentStatus = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { status, paidDate } = req.body;
    const updateData = { status: status }; // <-- ΔΙΟΡΘΩΣΗ ΤΥΠΟΥ
    if (paidDate) {
        updateData.paidDate = new Date(paidDate);
    }
    else if (status === 'PAID' && !paidDate) {
        updateData.paidDate = new Date();
    }
    const updatedPayment = await database_js_1.prisma.payment.update({
        where: { id },
        data: updateData,
    });
    logger_js_1.logger.info('Payment status updated', {
        paymentId: id,
        newStatus: status,
        updatedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Payment status updated successfully',
        data: { payment: updatedPayment }
    });
});
/**
 * Get payments by patient ID
 */
PaymentController.getPaymentsByPatientId = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { patientId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const skip = (page - 1) * limit;
    const where = { patientId };
    if (status) {
        where.status = status; // <-- ΔΙΟΡΘΩΣΗ ΤΥΠΟΥ
    }
    const [payments, total] = await Promise.all([
        database_js_1.prisma.payment.findMany({
            where,
            include: {
                creator: { select: { id: true, firstName: true, lastName: true } },
                treatmentPlan: { select: { id: true, title: true } }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
        }),
        database_js_1.prisma.payment.count({ where })
    ]);
    res.json({
        success: true,
        message: 'Patient payments retrieved successfully',
        data: {
            payments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            }
        }
    });
});
// ... (Ο υπόλοιπος κώδικας παραμένει ο ίδιος)
/**
 * Get payments by treatment plan ID
 */
PaymentController.getPaymentsByTreatmentPlanId = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { treatmentPlanId } = req.params;
    const payments = await database_js_1.prisma.payment.findMany({
        where: { treatmentPlanId },
        include: {
            creator: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            }
        },
        orderBy: { createdAt: 'desc' },
    });
    // Calculate payment summary
    const summary = {
        totalAmount: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
        paidAmount: payments
            .filter(payment => payment.status === 'PAID')
            .reduce((sum, payment) => sum + Number(payment.amount), 0),
        pendingAmount: payments
            .filter(payment => payment.status === 'PENDING')
            .reduce((sum, payment) => sum + Number(payment.amount), 0),
        overdueAmount: payments
            .filter(payment => payment.status === 'OVERDUE')
            .reduce((sum, payment) => sum + Number(payment.amount), 0),
        totalPayments: payments.length,
        paidPayments: payments.filter(payment => payment.status === 'PAID').length,
        pendingPayments: payments.filter(payment => payment.status === 'PENDING').length,
        overduePayments: payments.filter(payment => payment.status === 'OVERDUE').length,
    };
    res.json({
        success: true,
        message: 'Treatment plan payments retrieved successfully',
        data: {
            payments,
            summary
        }
    });
});
/**
 * Delete payment
 */
PaymentController.deletePayment = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await database_js_1.prisma.payment.delete({
        where: { id },
    });
    logger_js_1.logger.info('Payment deleted', {
        paymentId: id,
        deletedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Payment deleted successfully'
    });
});
/**
 * Get payment statistics
 */
PaymentController.getPaymentStats = (0, error_js_1.asyncHandler)(async (req, res) => {
    const [totalPayments, paidPayments, pendingPayments, overduePayments, totalRevenue, monthlyRevenue, averagePayment,] = await Promise.all([
        database_js_1.prisma.payment.count(),
        database_js_1.prisma.payment.count({ where: { status: 'PAID' } }),
        database_js_1.prisma.payment.count({ where: { status: 'PENDING' } }),
        database_js_1.prisma.payment.count({ where: { status: 'OVERDUE' } }),
        database_js_1.prisma.payment.aggregate({
            where: { status: 'PAID' },
            _sum: { amount: true },
        }),
        database_js_1.prisma.payment.aggregate({
            where: {
                status: 'PAID',
                paidDate: {
                    gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                },
            },
            _sum: { amount: true },
        }),
        database_js_1.prisma.payment.aggregate({
            where: { status: 'PAID' },
            _avg: { amount: true },
        }),
    ]);
    const stats = {
        totalPayments,
        paymentsByStatus: {
            paid: paidPayments,
            pending: pendingPayments,
            overdue: overduePayments,
            cancelled: totalPayments - paidPayments - pendingPayments - overduePayments,
        },
        revenue: {
            total: Number(totalRevenue._sum.amount || 0),
            monthly: Number(monthlyRevenue._sum.amount || 0),
            average: Number(averagePayment._avg.amount || 0),
        }
    };
    res.json({
        success: true,
        message: 'Payment statistics retrieved successfully',
        data: { stats }
    });
});
/**
 * Get payment methods summary
 */
PaymentController.getPaymentMethodsStats = (0, error_js_1.asyncHandler)(async (req, res) => {
    const paymentMethods = await database_js_1.prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: { status: 'PAID' },
        _count: { paymentMethod: true },
        _sum: { amount: true },
    });
    const methodsStats = paymentMethods.map(method => ({
        method: method.paymentMethod,
        count: method._count.paymentMethod,
        totalAmount: Number(method._sum.amount || 0),
    }));
    res.json({
        success: true,
        message: 'Payment methods statistics retrieved successfully',
        data: { paymentMethods: methodsStats }
    });
});
/**
 * Get overdue payments
 */
PaymentController.getOverduePayments = (0, error_js_1.asyncHandler)(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const [overduePayments, total] = await Promise.all([
        database_js_1.prisma.payment.findMany({
            where: {
                OR: [
                    { status: 'OVERDUE' },
                    {
                        status: 'PENDING',
                        dueDate: { lt: new Date() },
                    },
                ],
            },
            include: {
                patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
                treatmentPlan: { select: { id: true, title: true } }
            },
            skip,
            take: limit,
            orderBy: { dueDate: 'asc' },
        }),
        database_js_1.prisma.payment.count({
            where: {
                OR: [
                    { status: 'OVERDUE' },
                    {
                        status: 'PENDING',
                        dueDate: { lt: new Date() },
                    },
                ],
            },
        })
    ]);
    res.json({
        success: true,
        message: 'Overdue payments retrieved successfully',
        data: {
            overduePayments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            }
        }
    });
});
/**
 * Get upcoming payments (due soon)
 */
PaymentController.getUpcomingPayments = (0, error_js_1.asyncHandler)(async (req, res) => {
    const days = parseInt(req.query.days) || 7;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const upcomingPayments = await database_js_1.prisma.payment.findMany({
        where: {
            status: 'PENDING',
            dueDate: {
                gte: new Date(),
                lte: futureDate,
            },
        },
        include: {
            patient: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
            treatmentPlan: { select: { id: true, title: true } }
        },
        orderBy: { dueDate: 'asc' },
    });
    res.json({
        success: true,
        message: 'Upcoming payments retrieved successfully',
        data: { upcomingPayments }
    });
});
/**
 * Generate payment report
 */
PaymentController.generatePaymentReport = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate, patientId, treatmentPlanId, status } = req.query;
    const where = {};
    if (startDate && endDate) {
        where.createdAt = {
            gte: new Date(startDate),
            lte: new Date(endDate),
        };
    }
    if (patientId) {
        where.patientId = patientId;
    }
    if (treatmentPlanId) {
        where.treatmentPlanId = treatmentPlanId;
    }
    if (status) {
        where.status = status; // <-- ΔΙΟΡΘΩΣΗ ΤΥΠΟΥ
    }
    const [payments, summary] = await Promise.all([
        database_js_1.prisma.payment.findMany({
            where,
            include: {
                patient: { select: { id: true, firstName: true, lastName: true } },
                treatmentPlan: { select: { id: true, title: true } }
            },
            orderBy: { createdAt: 'desc' },
        }),
        database_js_1.prisma.payment.aggregate({
            where,
            _sum: { amount: true },
            _count: true,
            _avg: { amount: true },
        }),
    ]);
    const report = {
        period: {
            startDate: startDate || 'All time',
            endDate: endDate || 'All time',
        },
        summary: {
            totalPayments: summary._count,
            totalAmount: Number(summary._sum.amount || 0),
            averageAmount: Number(summary._avg.amount || 0),
        },
        payments,
        generatedAt: new Date().toISOString(),
        generatedBy: req.user.id,
    };
    logger_js_1.logger.info('Payment report generated', {
        reportPeriod: `${startDate || 'start'} to ${endDate || 'end'}`,
        totalPayments: summary._count,
        generatedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Payment report generated successfully',
        data: { report }
    });
});
/**
 * Mark payment as paid
 */
PaymentController.markAsPaid = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { paidDate, transactionId } = req.body;
    const updateData = {
        status: 'PAID', // <-- ΔΙΟΡΘΩΣΗ ΤΥΠΟΥ
        paidDate: paidDate ? new Date(paidDate) : new Date(),
    };
    if (transactionId) {
        updateData.transactionId = transactionId;
    }
    const updatedPayment = await database_js_1.prisma.payment.update({
        where: { id },
        data: updateData,
    });
    logger_js_1.logger.info('Payment marked as paid', {
        paymentId: id,
        markedBy: req.user.id,
    });
    res.json({
        success: true,
        message: 'Payment marked as paid successfully',
        data: { payment: updatedPayment }
    });
});
/**
 * Create payment plan for treatment
 */
PaymentController.createPaymentPlan = (0, error_js_1.asyncHandler)(async (req, res) => {
    const { treatmentPlanId, totalAmount, numberOfPayments, firstPaymentDate } = req.body;
    if (!treatmentPlanId || !totalAmount || !numberOfPayments) {
        throw new error_handler_js_1.BadRequestError('Treatment plan ID, total amount, and number of payments are required');
    }
    const paymentAmount = totalAmount / numberOfPayments;
    const payments = [];
    // Create individual payments
    for (let i = 0; i < numberOfPayments; i++) {
        const dueDate = new Date(firstPaymentDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        const paymentData = {
            patientId: req.body.patientId,
            treatmentPlanId,
            amount: paymentAmount,
            currency: 'EUR',
            paymentMethod: 'CASH',
            description: `Payment ${i + 1} of ${numberOfPayments} for treatment plan`,
            status: 'PENDING', // <-- ΔΙΟΡΘΩΣΗ ΤΥΠΟΥ
            dueDate,
            createdBy: req.user.id,
        };
        const payment = await database_js_1.prisma.payment.create({
            data: paymentData,
        });
        payments.push(payment);
    }
    logger_js_1.logger.info('Payment plan created', {
        treatmentPlanId,
        numberOfPayments,
        totalAmount,
        createdBy: req.user.id,
    });
    res.status(201).json({
        success: true,
        message: `Payment plan created successfully with ${numberOfPayments} payments`,
        data: { payments }
    });
});
exports.default = PaymentController;
