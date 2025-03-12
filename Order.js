import pool from './connect.js';
import { logger } from '../../common/logger.js';
import { OrderStatus, UserRole } from '../../constants/index.js';
import fs from 'fs';
import PDFDocument from 'pdfkit'
import moment from 'moment';
import pdf2base64 from 'pdf-to-base64';
import {
    setTimeout,
} from 'timers/promises';
import axios from "axios";
import * as zipLib from "zip-a-folder";
import { generateRndPrefix } from "../lib/utils.js";
import shell from "shelljs";
import {
    confirmShippedEmail
} from "../sender/templates.js";
import { sendMail } from "../lib/sendMail.js";
import path from "node:path";


/**
 * Crarate prf invoce method
 *
 * @param invoice - object
 * @param path - string
 * @param locale - string
 * @param ivoiceType - string
 * @param downloadType - string
 * @returns {Promise<{success: boolean}>}
 */
async function createInvoice (invoice, path, locale, ivoiceType, downloadType = '') {
    try {
        let doc = new PDFDocument({ size: "A4", margin: 50 });
        await generateHeader(doc, invoice.seller.data, locale);
        await generateCustomerInformation(doc, invoice, invoice.paymentDetails, locale, ivoiceType);
        await generateInvoiceTable(doc, invoice, locale, ivoiceType);
        await generateFooter(doc, locale);

        doc.end();
        doc.pipe(fs.createWriteStream(path));

        return {success: true}
    } catch (e) {
        console.log("error")
        return {success: false}
    }
}


/**
 * Generate pdf invoice header
 *
 * @param doc - pdf file
 * @param seller - object (seller info from DB)
 * @param locale - string
 * @returns {Promise<void>}
 */
async function generateHeader(doc, seller, locale) {
    doc
        .fillColor("#444444")
        .fontSize(20)
        .text("", 170, 0)
        .fontSize(10)
        .text(seller.full_address, 300, 50, { align: "right" })
        .text(`${seller.phone}`, 300, 75, { align: "right" })
        // .text(`${seller.address_line_1}`, 300, 65, { align: "right" })
        .text(seller.company_name, 300, 90, { align: "right" })
        .text("VAT: 20%", 300, 105, { align: "right" })
        // .text(seller.phone, 300, 95, { align: "right" })
        .moveDown();
}

/**
 * Generate custumer info block
 *
 * @param doc - pdf file
 * @param invoice - object
 * @param paymentData - object
 * @param locale - string
 * @param ivoiceType - string
 * @returns {Promise<void>}
 */
async function generateCustomerInformation(doc, invoice, paymentData, locale, ivoiceType) {
    const { default: t } = await import(`../sender/order-${locale}.js`);
    doc
        .fillColor("#444444")
        .fontSize(20)
        .text(ivoiceType !== 'refund' ? t["Invoice"] : t["Refund"], 50, 160);

    generateHr(doc, 185);
    const customerInformationTop = 200;
    let deliveryAddress = [];
    deliveryAddress[0] = invoice.shipping.country ? invoice.shipping.country : '';
    if (invoice.shipping.state) {
        deliveryAddress[1] = invoice.shipping.state ? invoice.shipping.state : 'N/A';
        deliveryAddress[2] = invoice.shipping.post_code;
        deliveryAddress[3] = invoice.shipping.city;
        deliveryAddress[4] = invoice.shipping.address;
    } else {
        deliveryAddress[1] = invoice.shipping.post_code;
        deliveryAddress[2] = invoice.shipping.city;
        deliveryAddress[3] = invoice.shipping.address;

    }
    const captionTotal = ivoiceType !== 'refund' ? t["Balance Due:"] : t["Refund Due:"];
    const captionNumber = ivoiceType !== 'refund' ? t["Invoice number:"] : t["Refund number:"];
    const captionDate = ivoiceType !== 'refund' ? t["Invoice Date:"] : t["Refund Date:"];

    let transactionId = '';
    // depend on payment method retrieve trinsaction ID
    if (invoice.paymentType === 'MASTERCARD' || invoice.paymentType === 'VISA') {
       transactionId = invoice.paymentDetails.paymentData.costs[0].transaction_id;
    } else if (invoice.paymentType === 'TRUSTLY') {
        transactionId = invoice.transaction_id;
    } else if (invoice.paymentType === 'CBC') {
        transactionId = invoice.transaction_id;
    } else if (invoice.paymentType === 'WECHAT') {
        transactionId = invoice.transaction_id;
    } else if (invoice.paymentType === 'MBWAY') {
        transactionId = invoice.transaction_id;
    } else if (invoice.paymentType === 'MULTIBANCO') {
        transactionId = invoice.transaction_id;
    } else if (invoice.paymentType === 'AMEX') {
        transactionId = invoice.transaction_id;
    } else if (invoice.paymentType === 'BANKTRANS') {
        transactionId = invoice.transaction_id;
    } else if (invoice.paymentType === 'PAYPAL') {
        transactionId = invoice.transaction_id;
    } else if (invoice.paymentType.includes('IDEAL')) {
        transactionId = invoice.transaction_id;
    } else if (invoice.paymentType.includes('ALIPAY')) {
        transactionId = invoice.transaction_id;
    } else if (invoice.paymentType.includes('MAESTRO')) {
        transactionId = invoice.transaction_id;
    } else if (paymentData.payment_details.type === 'BANKTRANS') {
        transactionId = paymentData.payment_details.external_transaction_id;
    } else if (paymentData.payment_details.type === 'ALIPAY') {
        transactionId = paymentData.transaction_id;
        // transactionId = '';
    } else if (paymentData.payment_details.type === 'MAESTRO') {
        transactionId = paymentData.transaction_id;
    }
    doc
        .fontSize(10)
        .text(captionNumber, 50, customerInformationTop)
        .font("Helvetica-Bold")
        .text(invoice.invoice_nr, 150, customerInformationTop)
        .font("Helvetica")
        .text(captionDate, 50, customerInformationTop + 15)
        .text(invoice.invoice_date, 150, customerInformationTop + 15)
        .text(captionTotal, 50, customerInformationTop + 30)
        .text(
            formatCurrency(parseFloat((0)) + parseFloat(invoice.shipping_amount) + parseFloat(invoice.subtotal) - parseFloat(invoice.refund_amount)),
            150,
            customerInformationTop + 30
        )
        .font("Helvetica-Bold");

    doc.text(invoice.shipping.name, 300, customerInformationTop)
        .font("Helvetica")
        .text(t["Delivery Address"]+deliveryAddress.join(','), 300, customerInformationTop + 15)
        .text(t["Transaction ID"]+transactionId, 300, customerInformationTop + 40)
        .text(t["Payment Method"]+invoice.paymentType, 300, customerInformationTop + 55)
        .moveDown();

    generateHr(doc, 282);
}

/**
 * Generate invoice products table
 *
 * @param doc - pdf file
 * @param invoice - object
 * @param locale - string
 * @param ivoiceType - string
 * @returns {Promise<void>}
 */
async function generateInvoiceTable(doc, invoice, locale, ivoiceType) {
    let i;
    const invoiceTableTop = 330;
    const { default: t } = await import(`../sender/order-${locale}.js`);

    doc.font("Helvetica-Bold");
    generateTableRow(
        doc,
        invoiceTableTop,
        t["Item"],
        t["Description"],
        t["Unit Cost"],
        t["Quantity"],
        t["Line Total"]
    );
    generateHr(doc, invoiceTableTop + 20);
    doc.font("Helvetica");
    // console.log(invoice.items);
    if (invoice.items) {
        for (i = 0; i < invoice.items.length; i++) {
            const item = invoice.items[i];
            const position = invoiceTableTop + (i + 1) * 30;
            generateTableRow(
                doc,
                position,
                item.name+` ${item.color_name ? t["color"]+': '+ item.color_name : ''} ${item.size_name ? t['size']+': '+item.size_name : ''}`,
                item.description,
                formatCurrency(item.price),
                item.quantity,
                formatCurrency(item.price * item.quantity)
            );

            generateHr(doc, position + 20);
        }

        const subtotalPosition = invoiceTableTop + (i + 1) * 30;
        generateTableRow(
            doc,
            subtotalPosition,
            "",
            "",
            t["Subtotal"],
            "",
            formatCurrency(invoice.subtotal)
        );

        const paidToDatePosition = subtotalPosition + 20;
        generateTableRow(
            doc,
            paidToDatePosition,
            "",
            "",
            t["Shipping Amount"],
            "",
            formatCurrency(invoice.shipping_amount)
        );
        let refundToDatePosition = paidToDatePosition + 20;
        if (invoice.refund_amount) {

            generateTableRow(
                doc,
                refundToDatePosition,
                "",
                "",
                t["Shipping refund"],
                "",
                formatCurrency(invoice.refund_amount)
            );
        }
        // reacalculate vat
        let vatAmount = 0;
        let totalAmount = 0;
        // (parseInt(order.order_amount) + 10) - ((parseInt(order.order_amount) + 10)/1.2)
        totalAmount = parseFloat(invoice.subtotal) + parseFloat(invoice.shipping_amount);
        vatAmount = (parseFloat(invoice.subtotal) + parseFloat(invoice.shipping_amount)) / 1.2;

        const vatToDatePosition = invoice.refund_amount ? refundToDatePosition + 20 : paidToDatePosition + 30;
        generateTableRow(
            doc,
            vatToDatePosition,
            "",
            "",
            "VAT (20%)",
            "",
            formatCurrency(totalAmount - vatAmount)
        );


        const duePosition = vatToDatePosition + 25;
        doc.font("Helvetica-Bold");
        generateTableRow(
            doc,
            duePosition,
            "",
            "",
            t[ivoiceType !== 'refund' ? "Total Payment" : "Refund Payment"],
            "",
            formatCurrency(parseFloat((0)) + parseFloat(invoice.shipping_amount) + parseFloat(invoice.subtotal) - parseFloat(invoice.refund_amount))
        );
        doc.font("Helvetica");
    }
}

/**
 * Generate footer pdf document
 *
 * @param doc - pdf file
 * @returns {Promise<void>}
 */
async function generateFooter(doc) {
    doc
        .fontSize(10)
        .text(
            "",
            50,
            780,
            { align: "center", width: 500 }
        );
}

/**
 * Generate products table row
 *
 * @param doc - pdf file
 * @param y - position
 * @param item - object
 * @param description - description product
 * @param unitCost - price
 * @param quantity - quantity
 * @param lineTotal - total price
 */
function generateTableRow(
    doc,
    y,
    item,
    description,
    unitCost,
    quantity,
    lineTotal
) {
    doc
        .fontSize(10)
        .text(item, 50, y)
        // .text(description.replace(/<[^>]*>?/gm, ''), 150, y)
        .text(unitCost, 280, y, { width: 90, align: "right" })
        .text(quantity, 370, y, { width: 90, align: "right" })
        .text(lineTotal, 0, y, { align: "right" });
}

/**
 * Generate line
 *
 * @param doc - pdf file
 * @param y - position
 */
function generateHr(doc, y) {
    doc
        .strokeColor("#aaaaaa")
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

/**
 * Formatting price
 *
 * @param cents - float
 * @returns {string}
 */
function formatCurrency(cents) {
    // return "$" + (cents / 100).toFixed(2);
    return parseFloat(cents).toFixed(2)+'€';
}


class Order {
    /**
     *
     * @param sessionId - int
     * @returns {Promise<{error: {code: number, message: string}, items: null}|{error: null, items: *[]}>}
     */
    async createOrders (sessionId) {
        const client = await pool.connect();
        try {
            const productQuery = `SELECT * FROM data.set_orders_from_live_sessions_messages(${sessionId}, 100);`;
            await client.query(productQuery);
            const items = [];
            const error = null;

            return {
                items,
                error
            };

        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error (Create orders):',
                    { message: e.message }
                );
            }
            const items = null;
            const error = {
                code: 500,
                message: 'Error get list of users'
            };
            return {
                items,
                error
            };

        } finally {
            client.release();
        }
    }

    /**
     * Get product qty
     *
     * @param productId - integer
     * @param configId - integer
     * @returns {Promise<{qty: any}|{error: {code: number, message: string}}>}
     */
    async getProductQty (productId, configId) {
        const client = await pool.connect();
        try {
            const productQuery = `SELECT pc.quantity FROM data.products p LEFT JOIN data.product_configurations pc ON pc.product_id = p.id 
                                    WHERE p.id = 15 AND pc.id = 260;`;
            const resQuery = await client.query(productQuery);
            const qty = (resQuery.rows[0].quantity);
            return {
                qty
            };

        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error (Create orders):',
                    { message: e.message }
                );
            }
            // const items = null;
            const error = {
                code: 500,
                message: 'Error get list of product qty'
            };
            return {
                error
            };

        } finally {
            client.release();
        }
    }

    /**
     * Remove wait item from order
     *
     * @param itemId - integer
     * @returns {Promise<{success: boolean}|{error: {code: number, message: string}}>}
     */
    async removeItemWaitStatus(itemId) {
        const client = await pool.connect();
        try {
            await client.query(`UPDATE data.order_items SET status=null WHERE id='${itemId}'`);
            // check orderId parameters for waiting item
            return { success: true }

        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error (Create orders):',
                    { message: e.message }
                );
            }
            // const items = null;
            const error = {
                code: 500,
                message: 'Error get list of product qty'
            };
            return {
                error
            };

        } finally {
            client.release();
        }
    }


    /**
     * Update qty product by configuration in DB
     *
     * @param configId - integer
     * @param qty - integer
     * @returns {Promise<{success: boolean}|{error: {code: number, message: string}}>}
     */
    async updateConfigQty(configId, qty) {
        const client = await pool.connect();
        try {
            const orderData = await client.query(`SELECT quantity FROM 
                    data.product_configurations WHERE id='${configId}'`);

            if (orderData.rows.length > 0) {
                const newQty = parseInt(orderData.rows[0].quantity) - parseInt(qty);
                await client.query(`UPDATE data.product_configurations SET quantity='${newQty}'
                    WHERE id='${configId}'`);
                return { success: true }
            } else {
                return { success: true }
            }

        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error (Create orders):',
                    { message: e.message }
                );
            }
            // const items = null;
            const error = {
                code: 500,
                message: 'Error get list of product qty'
            };
            return {
                error
            };

        } finally {
            client.release();
        }
    }

    /**
     * Get current quantity for configuration from DB
     *
     * @param configId - integer
     * @returns {Promise<{error: {code: number, message: string}}|{success: boolean, qty: any}|{success: boolean, qty: number}>}
     */
    async getConfigQty(configId) {
        const client = await pool.connect();
        try {
            const orderData = await client.query(`SELECT quantity FROM 
                    data.product_configurations WHERE id='${configId}'`);

            if (orderData.rows.length > 0) {
                return { success: true, qty: orderData.rows[0].quantity }
            } else {
                return { success: true, qty: 0 }
            }

        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error (Create orders):',
                    { message: e.message }
                );
            }
            const error = {
                code: 500,
                message: 'Error get list of product qty'
            };
            return {
                error
            };

        } finally {
            client.release();
        }
    }


    /**
     * Update waiting item in DB
     *
     * @param orderId - integer
     * @returns {Promise<{error: {code: number, message: string}}>}
     */
    async updateWaitWithOrderId(orderId) {
        const client = await pool.connect();
        try {
            const orderData = await client.query(`UPDATE data.orders SET 
                    status='new', statusWaiting=null WHERE id='${orderId}' `);

        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error (Create orders):',
                    { message: e.message }
                );
            }
            // const items = null;
            const error = {
                code: 500,
                message: 'Error get list of product qty'
            };
            return {
                error
            };

        } finally {
            client.release();
        }
    }

    /**
     * Check item for send waiting messege to buyer
     *
     * @param configId
     * @returns {Promise<{error: {code: number, message: string}}|{items: (string|HTMLCollectionOf<HTMLTableRowElement>|number|SQLResultSetRowList|*[])}>}
     */
    async sendingMessageByWaiting(configId) {
        const client = await pool.connect();
        try {

            const waitingQuery = `SELECT data.order_items.message_id, order_id, data.order_items.quantity,
                        data.order_items.product_configuration_id, data.order_items.configuration,
                        data.live_sessions.store_id, data.live_sessions_messages.recipient_id, 
                        data.order_items.id AS wait_item_id, access_token, data.live_sessions_messages.message,
                        data.seller_settings.order_timer, data.seller_settings.free_shipping_timer, threshold,
                        data.user_stores.name as store_name, data.order_items.product_id
                    FROM data.order_items 
                    LEFT JOIN data.live_sessions ON data.live_sessions.id = data.order_items.live_sessions_id
                    LEFT JOIN data.user_stores ON data.user_stores.id = data.live_sessions.store_id
                    LEFT JOIN data.live_sessions_messages ON data.live_sessions_messages.message_id = data.order_items.message_id
                    LEFT JOIN data.seller_settings ON data.seller_settings.user_id = data.live_sessions.user_id
                    LEFT JOIN data.free_order_threshold foth ON foth.user_id = data.live_sessions.user_id
                    WHERE product_configuration_id=${configId} AND data.order_items.status='waiting'
                    ORDER BY data.order_items.created_at LIMIT 1`;

            const waitingData = await client.query(waitingQuery);

            return { items: waitingData.rows.length > 0 ? waitingData.rows : [] }

        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error (Create orders):',
                    { message: e.message }
                );
            }
            // const items = null;
            const error = {
                code: 500,
                message: 'Error get list of product qty'
            };
            return {
                error
            };

        } finally {
            client.release();
        }
    }

    /**
     * Return no parsed product config qty
     *
     * @param qty - integer
     * @param configId - integer
     * @returns {Promise<{error: {code: number, message: string}}>}
     */
    async returnNotParsedConfigQty(qty, configId) {
        const client = await pool.connect();
        try {
            await client.query(`UPDATE data.product_configurations SET quantity=quantity+${qty} WEHRE id='${configId}'`);

        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Return Not Parser Configured:',
                    { message: e.message }
                );
            }
            // const items = null;
            const error = {
                code: 500,
                message: 'Error get list of product qty'
            };
            return {
                error
            };

        } finally {
            client.release();
        }
    }

    /**
     *
     * @param itemId
     * @param qty
     * @param configId
     * @param orderId
     * @returns {Promise<{error: {code: number, message: string}, items: null}|{orderNuber: string}>}
     */
    async updateWaitingItemQty(itemId, qty, configId, orderId) {
        const client = await pool.connect();
        try {
            const dataOrderNumArr = (new Date().toISOString().slice(0,11).replace('T',' ')).split('-');
            const _tmpNumber = dataOrderNumArr[2]+dataOrderNumArr[1]+dataOrderNumArr[0];
            const queryNumber = `SELECT order_number FROM
                data.orders WHERE 
                    order_number LIKE '${_tmpNumber.replace(/ /g,'')}-%'
                    AND order_number NOT LIKE '%-WO-%'
                 ORDER BY created_at DESC LIMIT 1`;
            const orderNumData = await client.query(queryNumber);
            let _newOrderNumber;
            if (orderNumData.rows.length === 0) {
                _newOrderNumber = moment().format('YYYYMMDD')+'-1';
            } else {
                const _tNum = orderNumData.rows[0].order_number.split('-')
                _newOrderNumber = `${moment().format('YYYYMMDD')}-${parseInt(_tNum[1]) + 1}`;
            }
            const updtQueryItem = `UPDATE data.order_items SET status=null WHERE id=${itemId};`;
            await client.query(updtQueryItem);
            const waitItems = await client.query(`SELECT * FROM data.order_items WHERE id=${itemId}`);
            let totalAmount = 0;
            waitItems.rows.forEach(_item => {
                totalAmount += parseFloat(_item.price)*parseInt(_item.quantity);
            })
            //update product config qty
            const updtConfigQuery = `UPDATE data.product_configurations SET quantity=quantity - ${qty} WHERE id=${configId};`;
            await client.query(updtConfigQuery);


            if (orderId) {
                const updtQueryOrder = `UPDATE data.orders SET 
                        status='new', status_waiting=null, order_number='${_newOrderNumber}',
                        order_amount='${totalAmount}', total_amoint='${totalAmount}' 
                        WHERE id=${orderId};`;
                console.log('ZZZZ', updtQueryOrder);
                await client.query(updtQueryOrder);
            }

            return { orderNuber: _newOrderNumber }
        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error (runWaitWorkflow):',
                    { message: e.message }
                );
            }
            const items = null;
            const error = {
                code: 500,
                message: 'Error get list of users'
            };
            return {
                items,
                error
            };
        } finally {
            client.release();
        }
    }


    /**
     * Update qty for configured product
     *
     * @param configId - integer
     * @param qty - integer
     * @param sessionId - integer
     * @returns {Promise<{error: {code: number, message: string}, items: null}>}
     */
    async updateProductConfigQty(configId, qty, sessionId) {
        const client = await pool.connect();
        try {
            const updtQuery = `UPDATE data.product_configurations SET quantity=${qty} WHERE id=${configId};`;
            await client.query(updtQuery);
            // getting all wait with this configuration
            shell.exec(`pm2 start ../BE/storeJobs/jobStoreWaiting.js --name "jobStoreWaiting ${configId}" -- configId=${configId}`, function(code, output) {
                console.log('Exit code:', code);
                console.log('Program output:', output);
            });
            exit;

        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error (runWaitWorkflow):',
                    { message: e.message }
                );
            }
            const items = null;
            const error = {
                code: 500,
                message: 'Error get list of users'
            };
            return {
                items,
                error
            };
        } finally {
            client.release();
        }
    }

    /**
     * Fetch list waiting products
     *
     * @param page - integer
     * @param perPage - integer
     * @param user - object
     * @param isRead - boolean
     * @param reqOffset - integer
     * @param filters - object
     * @param column - string
     * @param sort - string
     * @returns {Promise<{size: any, error: null, items: (string|HTMLCollectionOf<HTMLTableRowElement>|number|SQLResultSetRowList|*[])}|{error: {code: number, message: string}, items: null}>}
     */
    async fetchWaitingItems (page, perPage = 20, user, isRead = false, reqOffset = null, filters, column, sort) {
        const client = await pool.connect();
        try {
            const _filters = JSON.parse(filters);

            switch (user.role_id) {
                case UserRole.ADMIN:
                    break;
                case UserRole.CUSTOMER:
                    _filters.seller_id = [user.id];
                    break;
                case UserRole.BUYER:
                    _filters.buyer_id = [user.id];
            }

            const _total = await client.query(`SELECT count FROM data.get_orders_waiting_list_count('${JSON.stringify(_filters)}');`);
            const size = _total.rows[0].count;
            let offset;
            if (reqOffset) {
                offset = reqOffset;
            } else {
                offset = (Number(page) - 1) * Number(perPage);
            }
            const ordersQuery = `SELECT
                    id_cnt, live_sessions_id, product_id, product_configuration_id, configuration, item_buyers, total_quantity, total_price
                FROM data.get_orders_waiting_list_new(${perPage}, ${offset}, '${JSON.stringify(_filters)}', '${column} ${sort}');`;
            const res = await client.query(ordersQuery);
            const items = res.rows.length > 0 ? res.rows : [];
            const error = null;

            return {
                items,
                size,
                error
            };

        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error (Products getAll):',
                    { message: e.message }
                );
            }
            const items = null;
            const error = {
                code: 500,
                message: 'Error get list of users'
            };
            return {
                items,
                error
            };
        } finally {
            client.release();
        }
    }


    /**
     * Fetch list live items
     *
     * @param page - integer
     * @param perPage - integer
     * @param user - object
     * @param isRead - boolean
     * @param reqOffset - integer
     * @param filters - object
     * @param column - string
     * @param sort - string
     * @returns {Promise<{size: any, error: null, items: (string|HTMLCollectionOf<HTMLTableRowElement>|number|SQLResultSetRowList|*[])}|{error: {code: number, message: string}, items: null}>}
     */
    async fetchLiveItems (page, perPage = 20000, user, isRead = false, reqOffset = null, filters, column, sort) {
        const client = await pool.connect();
        try {
            const _filters = JSON.parse(filters);
            // fetch cart duration
            const sellerSettingsSQL = `SELECT * FROM data.seller_settings WHERE user_id=${user.id}`;
            const settingsRes = await client.query(sellerSettingsSQL);
            let expireAtInterval;
            let expireAtIntervalPeriod;

            if (settingsRes.rows[0].order_timer.hours) {
                expireAtIntervalPeriod = settingsRes.rows[0].order_timer.hours;
                expireAtInterval = 'hour';
            }
            if (settingsRes.rows[0].order_timer.days) {
                expireAtIntervalPeriod = settingsRes.rows[0].order_timer.days;
                expireAtInterval = 'day';
            }
            if (settingsRes.rows[0].order_timer.minutes) {
                expireAtIntervalPeriod = settingsRes.rows[0].order_timer.minutes;
                expireAtInterval = 'minute';
            }

            console.log(settingsRes.rows[0]);

            switch (user.role_id) {
                case UserRole.ADMIN:
                    break;
                case UserRole.CUSTOMER:
                    _filters.seller_id = [user.id];
                    if (_filters.shopper_id) {
                        _filters.buyer_id = _filters.shopper_id;
                        delete _filters.userIds;
                    }
                    break;
                case UserRole.BUYER:
                    _filters.buyer_id = [user.id];
            }
            _filters.status = [OrderStatus.NEW, OrderStatus.WAITING];
            // _filters.sync_at = NULL;

            // _filters.buyer_id = _filters.shopper_id;
            const _total = await client.query(`SELECT count FROM data.get_orders_count('${JSON.stringify(_filters)}');`);
            const size = _total.rows[0].count;
            let offset;
            if (reqOffset) {
                offset = reqOffset;
            } else {
                offset = (Number(page) - 1) * Number(perPage);
            }
            if (!column && !sort) {

            } else {

            }

            const ordersQuery = `SELECT *
                                FROM data.get_orders (${perPage}, ${offset}, '${JSON.stringify(_filters)}', 'created_at DESC');`;
            const res = await client.query(ordersQuery);
            // const items = res.rows.length > 0 ? res.rows : [];
            const _items = res.rows.length > 0 ? res.rows : [];
            const _orderIds = [];
            if (_items.length > 0) {
                // console.log(_items)
                const orderIds = [];
                _items.map(_order => {
                    _orderIds.push(_order.id);
                })
            }
            const updateExpireQuery = `UPDATE data.orders SET expire_order_at = 
                sync_at  + (INTERVAL '${expireAtIntervalPeriod} ${expireAtInterval}') 
                WHERE id IN (${_orderIds.join(',')})`;
            await client.query(updateExpireQuery);

            const ordersQueryUpdt = `SELECT *
                                FROM data.get_orders (${perPage}, ${offset}, '${JSON.stringify(_filters)}', 'created_at DESC');`;
            const resUpdt = await client.query(ordersQueryUpdt);
            const items = resUpdt.rows.length > 0 ? resUpdt.rows : [];

            const error = null;
            return {
                items,
                size,
                error
            };

        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error (Products getAll):',
                    { message: e.message }
                );
            }
            const items = null;
            const error = {
                code: 500,
                message: 'Error get list of users'
            };
            return {
                items,
                error
            };

        } finally {
            client.release();
        }
    }


    /**
     * Fetch order items
     *
     * @param page - integer
     * @param perPage - integer
     * @param user - object
     * @param isRead - boolean
     * @param reqOffset - integer
     * @param filters - object
     * @param column - string
     * @param sort - string
     * @returns {Promise<{error: {code: number, message: string}, items: null}|{grouppedStatuses: *[], size: any, error: null, items: (string|HTMLCollectionOf<HTMLTableRowElement>|number|SQLResultSetRowList|*[])}>}
     */
    async fetchItems (page, perPage = 20, user, isRead = false, reqOffset = null, filters, column, sort) {
        const client = await pool.connect();
        try {
            const _filters = JSON.parse(filters);
            switch (user.role_id) {
                case UserRole.ADMIN:
                    break;
                case UserRole.CUSTOMER:
                    _filters.seller_id = [user.id];
                    if (_filters.shopper_id) {
                        _filters.buyer_id = _filters.shopper_id;
                        delete _filters.userIds;
                    }
                    break;
                case UserRole.BUYER:
                    _filters.buyer_id = [user.id];
            }
            // _filters.buyer_id = [1095];
            if (_filters.status?.length === 0) {
                if (user.role_id === UserRole.BUYER) {
                    _filters.status = [OrderStatus.PAYED, OrderStatus.SHIPPED, OrderStatus.CANCELED, OrderStatus.NEW, OrderStatus.WAITING];
                } else {
                    _filters.status = [OrderStatus.PAYED, OrderStatus.SHIPPED, OrderStatus.CANCELED];
                }
            }

            // _filters.buyer_id = _filters.shopper_id;
            const _total = await client.query(`SELECT count FROM data.get_orders_count('${JSON.stringify(_filters)}');`);
            const size = _total.rows[0].count;
            let offset;
            if (reqOffset) {
                offset = reqOffset;
            } else {
                offset = (Number(page) - 1) * Number(perPage);
            }
            if (!column && !sort) {

            } else {

            }
            const ordersQuery = `SELECT *
                                FROM data.get_orders (${perPage}, ${offset}, '${JSON.stringify(_filters)}', '${column} ${sort}');`;
            const res = await client.query(ordersQuery);
            const items = res.rows.length > 0 ? res.rows : [];
            const _items = res.rows.length > 0 ? res.rows : [];
            const _orderIds = [];
            if (_items.length > 0) {
                // console.log(_items)
                const orderIds = [];
                _items.map(_order => {
                    _orderIds.push(_order.id);
                })
            }
            let orderStatuses;
            let orderStatusesRes = [];
            if (_orderIds.length) {
                orderStatuses = `
                    SELECT
                        json_agg(
                            json_build_object(
                            'status', order_statuses.status,
                            'created_at', order_statuses.created_at,
                            'order_id', order_statuses.order_id
                            )
                        ) AS order_statuses
                    FROM data.order_statuses
                    WHERE TRUE
                        AND (order_statuses.order_id IN (${_orderIds.join(',')}))
                `;
                orderStatusesRes = await client.query(orderStatuses);
            }
            const _itemStatuses = orderStatusesRes.rows[0].order_statuses;
            const _itemStatusesIds = [];
            const grouppedStatuses = [];
            if (orderStatusesRes.rows[0].order_statuses !== null) {
                orderStatusesRes.rows[0].order_statuses.map(status => {
                    _itemStatusesIds.push(status.order_id);
                });
                let unique = _itemStatusesIds.reduce(function (a, b)  {
                    if (a.indexOf(b) < 0) a.push(b);
                    return a;
                }, []);
                unique.forEach(_id => {
                    grouppedStatuses.push({id:_id, statuses:(_itemStatuses.filter(obj => {
                            return obj.order_id === _id
                        }))});
                });
            }
            const error = null;

            return {
                items,
                grouppedStatuses,
                size,
                error
            };

        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error (Products getAll):',
                    { message: e.message }
                );
            }
            const items = null;
            const error = {
                code: 500,
                message: 'Error get list of users'
            };
            return {
                items,
                error
            };

        } finally {
            client.release();
        }
    }

    /**
     * Fetch filters for orders list
     *
     * @param user - object
     * @param type - string
     * @returns {Promise<{res: {}, error: null}|{error: {code: number, message: string}, items: null}>}
     */
    async fetchFilters (user, type) {
        const client = await pool.connect();
        try {
            const _filters = {};
            if (user.role_id === UserRole.BUYER) {
                _filters.status = [OrderStatus.PAYED, OrderStatus.SHIPPED, OrderStatus.CANCELED, OrderStatus.NEW];
            } else {
                _filters.status = [OrderStatus.PAYED, OrderStatus.SHIPPED, OrderStatus.CANCELED];
            }
            switch (user.role_id) {
                case UserRole.ADMIN:
                    break;
                case UserRole.CUSTOMER:
                    _filters.seller_id = [user.id];
                    break;
                case UserRole.BUYER:
                    _filters.buyer_id = [user.id];
            }
            const res = {};
            const shipping = await client.query(`SELECT * FROM data.get_orders_shipping('${JSON.stringify(_filters)}');`);
            res.shippings = shipping.rows[0].shipping ? shipping.rows[0].shipping : [];
            const payments = await client.query(`SELECT * FROM data.get_orders_payments('${JSON.stringify(_filters)}');`);
            res.payments = payments.rows[0].payments ? payments.rows[0].payments : [];
            const countries = await client.query(`SELECT * FROM data.get_orders_countries('${JSON.stringify(_filters)}');`);
            res.countries = countries.rows[0].countries ? countries.rows[0].countries : [];
            const amounts = await client.query(`SELECT * FROM data.get_orders_total_amount_range('${JSON.stringify(_filters)}');`);
            res.amounts = amounts.rows[0].total_amount_range.max ? [amounts.rows[0].total_amount_range.min, amounts.rows[0].total_amount_range.max] : [];
            const error = null;
            const _filterBuyers = {};
            if (user.role_id === 2) {
                _filterBuyers.seller_id = [user.id];
                if (_filterBuyers.userIds) {
                    _filterBuyers.seller_id = _filters.userIds;
                    delete _filterBuyers.userIds;
                }
            }
            let ordersQueryBuyers;
            if (type === 'waiting') {
                console.log(`SELECT * FROM data.get_buyers_waiting(100000, 0, '${JSON.stringify(_filterBuyers)}', 'first_name ASC');`);
                ordersQueryBuyers = await client.query(`SELECT * FROM data.get_buyers_waiting(100000, 0, '${JSON.stringify(_filterBuyers)}', 'first_name ASC');`); // 'orders.created_at DESC'
            } else {
                ordersQueryBuyers = await client.query(`SELECT * FROM data.get_buyers(100000, 0, '${JSON.stringify(_filterBuyers)}', 'first_name ASC');`); // 'orders.created_at DESC'
            }
            res.buyers =  ordersQueryBuyers.rows;
            // res.shoppers = await client.query(`SELECT * FROM data.orders WHERE ('${JSON.stringify(_filters)}');`);

            return {
                res,
                error
            };

        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error (Products getAll):',
                    { message: e.message }
                );
            }
            const items = null;
            const error = {
                code: 500,
                message: 'Error get list of users'
            };
            return {
                items,
                error
            };

        } finally {
            client.release();
        }
    }


    /**
     * Generate order pdf
     *
     * @param orderNumber - string
     * @param userId - integer
     * @param user - object
     * @param locale -  string
     * @param type - string
     * @param typeInvoice - string
     * @returns {Promise<{fileName: string, error: {code: number, message: string}}|{filename: string, fileEncoded: unknown, error: null}|{isCreated: boolean, filename: string, fileEncoded: unknown, error: null}>}
     */
    async generatePdf (orderNumber, userId, user, locale, type='download', typeInvoice='') {
        const client = await pool.connect();
        const { default: t } = await import(`../sender/order-${locale}.js`);
        let error = null;
        try {
            const _filters = {
                order_number: orderNumber
            };

            switch (user.role_id) {
                case UserRole.ADMIN:
                case UserRole.CUSTOMER:
                    _filters.seller_id = userId;
                    break;
                case UserRole.BUYER:
                    _filters.buyer_id = userId;
            }
            const filter = JSON.stringify(_filters);
            const ordersQuery = `SELECT *
                                FROM data.get_orders(1, 0, '${filter}');`;
            const res = await client.query(ordersQuery);
            const orderId = res.rows[0].id;
            let historyRes;
            if (res.rows[0].status === 'canceled') {
                historyRes  = await client.query(`SELECT * FROM data.order_statuses WHERE order_id='${orderId}' AND status='canceled'`);
            } else {
                historyRes  = await client.query(`SELECT * FROM data.order_statuses WHERE order_id='${orderId}' AND status='payed'`);
            }
            if (!historyRes.rows[0]) {
                await client.query(`INSERT INTO data.order_statuses (order_id, status) VALUES ('${orderId}', 'payed')`);
                historyRes  = await client.query(`SELECT * FROM data.order_statuses WHERE order_id='${orderId}' AND status='payed'`);
            }
            let dirUpload = `${process.env.DOWNLOAD_FOLDER}/orders/${userId}/${locale}`;
            let dirUploadForCreate = `${process.env.DOWNLOAD_FOLDER}/orders/${userId}`;
            const dirArchiveFolder = `${process.env.DOWNLOAD_FOLDER}/users/${userId}/orders/invoices`;
            if (type === 'download' && !fs.existsSync(dirArchiveFolder)) {
                if (!fs.existsSync(`${process.env.DOWNLOAD_FOLDER}/users/${userId}`)) {
                    fs.mkdirSync(`${process.env.DOWNLOAD_FOLDER}/users/${userId}`);
                }
                if (!fs.existsSync(`${process.env.DOWNLOAD_FOLDER}/users/${userId}/orders`)) {
                    fs.mkdirSync(`${process.env.DOWNLOAD_FOLDER}/users/${userId}/orders`);
                }
                if (!fs.existsSync(`${process.env.DOWNLOAD_FOLDER}/users/${userId}/orders/invoices`)) {
                    fs.mkdirSync(`${process.env.DOWNLOAD_FOLDER}/users/${userId}/orders/invoices`);
                }
                if (!fs.existsSync(`${process.env.DOWNLOAD_FOLDER}/users/${userId}/orders/download`)) {
                    fs.mkdirSync(`${process.env.DOWNLOAD_FOLDER}/users/${userId}/orders/download`);
                }
            }

            if (fs.existsSync(`${process.env.DOWNLOAD_FOLDER}/orders/${userId}/${locale}/${type === 'download' ? 'invoices/' : ''}${typeInvoice !== 'refund' ? 'invoice' : 'refund'}_${res.rows[0].order_number}_${locale}.pdf`)) {
                const base64 = await pdf2base64(`${process.env.DOWNLOAD_FOLDER}/orders/${userId}/${locale}/${type === 'download' ? 'invoices/' : ''}${typeInvoice !== 'refund' ? 'invoice' : 'refund'}_${res.rows[0].order_number}_${locale}.pdf`)
                    .then(
                        (response) => {
                            return response;
                        }
                    )
                    .catch(
                        (error) => {
                            console.log(error.message); //Exepection error....
                        }
                    );
                return {
                    filename: `${process.env.DB_DOWNLOAD_FOLDER}/orders/${userId}/${locale}/${typeInvoice !== 'refund' ? 'invoice' : 'refund'}_${res.rows[0].order_number}_${locale}.pdf`,
                    fileEncoded: base64,
                    error: null
                }
            } else {
                if (!fs.existsSync(`${dirUploadForCreate}/${locale}`)) {
                    if (!fs.existsSync(`${dirUploadForCreate}`)) {
                        fs.mkdirSync(dirUploadForCreate);
                    }
                    fs.mkdirSync(`${dirUploadForCreate}/${locale}`);
                    fs.mkdirSync(`${dirUploadForCreate}/${locale}/download`);
                    // dirUpload = dirUpload + '/' + locale
                }
                if (!fs.existsSync(`${dirUploadForCreate}/${locale}/download`)) {
                    fs.mkdirSync(`${dirUploadForCreate}/${locale}/download`);
                }
            }
            if (res.rows.length > 0) {
                // get buyer information
                const addressRes = await client.query(`SELECT data.addresses.*, data.users.company_name, data.users.phone
                                                       FROM data.addresses LEFT JOIN data.users ON data.users.id=data.addresses.user_id
                                                       WHERE user_id=${res.rows[0].buyer_id}`);
                const buyerData = await client.query(`SELECT * FROM data.users WHERE id='${res.rows[0].buyer_id}'`);

                const sellerData = await client.query(`SELECT * FROM data.users WHERE id='${res.rows[0].seller_id}'`);
                const sellerApiData = await client.query(`SELECT * FROM data.seller_settings WHERE user_id=${res.rows[0].seller_id}`);
                const historyStatusRes = await client.query(`SELECT * FROM data.order_statuses WHERE order_id='${res.rows[0].id}' AND status='${typeInvoice !== 'refund' ? 'payed' : 'canceled'}'`);
                const orderNuberForMultisafe = `${process.env.MULTISAFE_ORDER_PREFIX}-${res.rows[0].id}`;
                const multiOrderPaymentData = await axios
                    .get(`${process.env.MULTISAFEPAY_URL}/orders/${process.env.MULTISAFE_ORDER_PREFIX}-${res.rows[0].id}?api_key=${sellerApiData.rows[0].multisafe_api_key}`, {}, {
                        headers: { 'Content-Type': 'application/json' }
                    })
                    .then(async (res) => {
                        // console.log('DATA SABRINA', res.data);
                        return {'success': true, paymentData: res.data.data}
                    }).catch(error => {
                        console.log(error.message)
                        return {error: error.message}
                    });

                const refundAmount = parseFloat(res.rows[0].refund_amount);
                const coutryRes = await client.query(`SELECT nicename FROM data.countries WHERE id='${res.rows[0].country_id}'`);
                // console.log(buyerData.rows[0].first_name + (buyerData.rows[0].last_name ? " "+buyerData.rows[0].last_name : ''));
                const invoice = {
                    shipping: {
                        name: buyerData.rows[0].first_name + " " +(buyerData.rows[0].last_name ? buyerData.rows[0].last_name : ''),
                        address: res.rows[0].shipping_address,
                        state: res.rows[0].state,
                        city: res.rows[0].city,
                        post_code: res.rows[0].post_code,
                        phone: res.rows[0].phone,
                        country: coutryRes.rows[0].nicename
                    },
                    seller: {
                        data: sellerData.rows[0]
                    },
                    status: res.rows[0].status,
                    items: res.rows[0].order_items,
                    subtotal: res.rows[0].order_amount,
                    refund_amount: refundAmount,
                    shipping_amount: res.rows[0].shipping_amount,
                    paid: res.rows[0].total_amount,
                    invoice_nr: res.rows[0].order_number+(typeInvoice !== 'refund' ? '' : `-${res.rows[0].refund_prefix}`),
                    invoice_date: moment(historyRes.rows[0].created_at).format('DD/MM/YYYY'),
                    paymentDetails: multiOrderPaymentData,
                    transaction_id: multiOrderPaymentData.paymentData.payment_methods[0].external_transaction_id,
                    paymentType: multiOrderPaymentData.paymentData.payment_methods[0].type,
                    orderId: orderId
                };

                // save payment method to db
                await client.query(`UPDATE data.orders SET payment_method='${multiOrderPaymentData.paymentData.payment_methods[0].type}' WHERE id=${orderId}`);

                await createInvoice(invoice, `${dirUpload}/${typeInvoice !== 'refund' ? 'invoice' : 'refund'}_${res.rows[0].order_number}_${locale}.pdf`, locale, typeInvoice !== 'refund' ? 'invoice' : 'refund', type);

                if (!fs.existsSync(`${process.env.DOWNLOAD_FOLDER}/orders/${userId}/${locale}/${typeInvoice !== 'refund' ? 'invoice' : 'refund'}_${res.rows[0].order_number}_${locale}.pdf`)) {
                    await setTimeout(2000);
                }
                if (fs.existsSync(`${process.env.DOWNLOAD_FOLDER}/orders/${userId}/${locale}/${typeInvoice !== 'refund' ? 'invoice' : 'refund'}_${res.rows[0].order_number}_${locale}.pdf`) && type ==='download') {
                    fs.copyFile(`${process.env.DOWNLOAD_FOLDER}/orders/${userId}/${locale}/${typeInvoice !== 'refund' ? 'invoice' : 'refund'}_${res.rows[0].order_number}_${locale}.pdf`, `${process.env.DOWNLOAD_FOLDER}/orders/${userId}/${locale}/download/${typeInvoice !== 'refund' ? 'invoice' : 'refund'}_${res.rows[0].order_number}_${locale}.pdf`, (err) => {
                        if (err) {
                            console.log("Error Found:", err);
                        }
                        else {
                            console.log('file copied')
                        }
                    });
                }
                const base64 = await pdf2base64(`${process.env.DOWNLOAD_FOLDER}/orders/${userId}/${locale}/${typeInvoice !== 'refund' ? 'invoice' : 'refund'}_${res.rows[0].order_number}_${locale}.pdf`)
                    .then(
                        (response) => {
                            return response;
                        }
                    )
                    .catch(
                        (error) => {
                            console.log(error); //Exepection error....
                        }
                    );
                return {
                    filename: `${process.env.DB_DOWNLOAD_FOLDER}/orders/${userId}/${locale}/${typeInvoice !== 'refund' ? 'invoice' : 'refund'}_${res.rows[0].order_number}_${locale}.pdf`,
                    fileEncoded: base64,
                    isCreated: true,
                    error: null
                }
            }
        } catch (e) {
            console.log(e.message)
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error (Generate PDF):',
                    { message: e.message }
                );
            }
            error = {
                code: 500,
                message: 'Model error (Generate PDF):'
            };
            return  {
                fileName: '',
                error
            }
        } finally {
            client.release();
        }
    }


    /**
     * Connect new item from fb comment with exist order
     *
     * @param commentId - integer
     * @param userId - integer
     * @returns {Promise<{success: boolean, error}|{data: *, success: boolean, error: null}>}
     */
    async updateOrderByCommentId (commentId, userId) {
        const client = await pool.connect();
        try {
            const SQL = `SELECT * FROM data.order_items WHERE message_id='${commentId}';`;
            const res = await client.query(SQL);
            if (res.rows[0]) {
                const orderId = res.rows[0].order_id;
                await client.query(`UPDATE data.orders SET user_id=${userId} WHERE id=${orderId}`);
            }
            return {success: true, error: null, data: res.rows[0]};
        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error:',
                    { message: e.message }
                );
            }
            return {success: false, error: e.message };
        } finally {
            client.release();
        }
    }

    /**
     * Fetch total order amount
     *
     * @param orderNumber - string
     * @returns {Promise<{success: boolean, error}|{data: *, success: boolean, error: null}>}
     */
    async fetchTotal (orderNumber) {
        const client = await pool.connect();
        try {
            const SQL = `SELECT * FROM data.orders WHERE order_number = '${orderNumber}';`;
            const res = await client.query(SQL);
            return {success: true, error: null, data: res.rows[0]};
        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error:',
                    { message: e.message }
                );
            }
            return {success: false, error: e.message };
        } finally {
            client.release();
        }
    }


    /**
     * Check order status
     *
     * @param messageId - string
     * @returns {Promise<{success: boolean, error}|{data: *, success: boolean, error: null}>}
     */
    async checkOrderStatus (messageId) {
        const client = await pool.connect();
        try {
            const SQL = `SELECT * FROM data.order_items WHERE message_id = '${messageId}';`;
            const res = await client.query(SQL);
            return {success: true, error: null, data: res.rows[0]};
        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error:',
                    { message: e.message }
                );
            }
            return {success: false, error: e.message };
        } finally {
            client.release();
        }
    }

    /**
     * Setup shipping status for orders
     *
     * @param orderIds - array
     * @returns {Promise<{success: boolean, error}|{success: boolean, error: null}>}
     */
    async setupShippingStatus (orderIds) {
        const client = await pool.connect();
        try {
            // send email about shipping
            const emailSql = `
                SELECT data.users.*, data.user_stores.name AS store_name, 
                    data.orders.order_number, data.users.selected_locale,
                    data.users.email, data.users.email_real
                FROM data.orders 
                    LEFT JOIN data.users ON data.users.id=data.orders.user_id 
                    LEFT JOIN data.live_sessions ON data.live_sessions.id = data.orders.live_sessions_id
                    LEFT JOIN data.user_stores ON data.user_stores.id = data.live_sessions.store_id                   
                    WHERE data.orders.id IN (${orderIds.join(',')})`;
            const emailRes = await client.query(emailSql);
            let mail = '';
            let mailSendAddress = '';

            await emailRes.rows.forEach(async _order => {
                mail = await confirmShippedEmail(_order.email, _order.selected_locale ? _order.selected_locale : 'fr', _order);
                mailSendAddress = _order.email
                if (!_order.email.match(
                    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
                )) {
                    mailSendAddress = _order.email_real;
                };

                sendMail(
                    mailSendAddress,
                    mail.subject,
                    mail.body
                );
            })
            const SQL = `UPDATE data.orders SET status='shipped' WHERE id IN (${orderIds.join(',')})`;
            await client.query(SQL);
            return {success: true, error: null};
        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error:',
                    { message: e.message }
                );
            }
            return {success: false, error: e.message };
        } finally {
            client.release();
        }
    }


    /**
     * Remove item from order
     *
     * @param orderItemId - integer
     * @returns {Promise<{success: boolean, error}|{success: boolean, error: null}>}
     */
    async removeOrderItem (orderItemId) {
        const client = await pool.connect();
        try {
            const itemRow = await client.query(`SELECT * FROM data.order_items WHERE id='${orderItemId}'`);
            const itemConfigurationId = itemRow.rows[0].product_configuration_id;

            // start waiting when remove item from cart
            shell.exec(`pm2 start ../BE/storeJobs/jobStoreWaiting.js --name "jobStoreWaiting ${itemConfigurationId}" -- configId=${itemConfigurationId}`, function(code, output) {
                console.log('Exit code:', code);
                console.log('Program output:', output);
            });

            await client.query(`UPDATE data.orders SET 
                order_amount=order_amount - ${itemRow.rows[0].price*itemRow.rows[0].quantity},
                total_amount=total_amount - ${itemRow.rows[0].price*itemRow.rows[0].quantity}
                WHERE id=${itemRow.rows[0].order_id}`);
            await client.query(`DELETE FROM data.order_items WHERE id='${orderItemId}'`);
            // return quantity to product
            await client.query(`UPDATE data.product_configurations SET quantity = quantity + ${itemRow.rows[0].quantity}
                WHERE id='${itemRow.rows[0].product_configuration_id}'`);
            return {success: true, error: null};
        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error:',
                    { message: e.message }
                );
            }
            return {success: false, error: e.message };
        } finally {
            client.release();
        }
    }


    /**
     * Minus product qty from order
     *
     * @param orderItemId
     * @returns {Promise<{success: boolean, error}|{success: boolean, error: null}>}
     */
    async minusOrderItem (orderItemId) {
        const client = await pool.connect();
        try {
            const itemRow = await client.query(`SELECT * FROM data.order_items WHERE id='${orderItemId}'`);
            console.log(itemRow.rows[0]);
            console.log(`UPDATE data.orders SET
                order_amount=order_amount - ${itemRow.rows[0].price*1},
                total_amount=total_amount - ${itemRow.rows[0].price*1}
                WHERE id=${itemRow.rows[0].order_id}`);
            await client.query(`UPDATE data.orders SET
                order_amount=order_amount - ${itemRow.rows[0].price*1},
                total_amount=total_amount - ${itemRow.rows[0].price*1}
                WHERE id=${itemRow.rows[0].order_id}`);
            // console.log(`UPDATE data.order_items SET quantity = quantity - 1 WHERE id='${orderItemId}'`);
            await client.query(`UPDATE data.order_items SET quantity = quantity - 1 WHERE id='${orderItemId}'`);
            await client.query(`UPDATE data.product_configurations SET quantity = quantity + 1
                WHERE id='${itemRow.rows[0].product_configuration_id}'`);

            shell.exec(`pm2 start ../BE/storeJobs/jobStoreWaiting.js --name "jobStoreWaiting ${itemRow.rows[0].product_configuration_id}" -- configId=${itemRow.rows[0].product_configuration_id}`, function(code, output) {
                console.log('Exit code:', code);
                console.log('Program output:', output);
            });

            return {success: true, error: null};
        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error:',
                    { message: e.message }
                );
            }
            return {success: false, error: e.message };
        } finally {
            client.release();
        }
    }


    /**
     * Connect message if from link on fb messenger with store order
     *
     * @param messageId - integer
     * @param fromId - string
     * @param storeId - integer
     * @param inPeriod - boolean
     * @param freePeriodEnd - booolean
     * @returns {Promise<{success: boolean}|{success: boolean, error}>}
     */
    async connectThrowStore(messageId, fromId, storeId, inPeriod, freePeriodEnd) {
        const client = await pool.connect();
        try {
            // find order by message and attach to current user
            const connetedQuery = `SELECT * FROM data.user2pages 
                WHERE from_id='${fromId}' AND store_id=${storeId}`;
            const connetedQueryRes = await client.query(connetedQuery);
            const queryOrder = `SELECT data.orders.id, data.orders.user_id AS fake_user_id,
                    data.orders.live_sessions_id, data.orders.order_amount, 
                    data.orders.total_amount
                    FROM data.order_items LEFT JOIN 
                    data.orders ON data.orders.id = data.order_items.order_id 
                    WHERE message_id='${messageId}'`;
            const findedOrderRes = await client.query(queryOrder);
            const fakeUserId = findedOrderRes.rows[0].fake_user_id;
            let _endPeriod;
            if (freePeriodEnd) {
                const pEnd = moment(freePeriodEnd);
                const pNow = moment();
                if (pNow > pEnd) {
                    // console.log('DELETE FROM settings period');
                    // await client.query(`UPDATE data.seller_settings SET free_shipping_from=null, free_shipping_to=null WHERE `)
                } else {
                    _endPeriod = `${moment(freePeriodEnd).format('YYYY-MM-DD')} ${moment(freePeriodEnd).format('HH:mm:ss')}`;
                    await client.query(`UPDATE data.orders
                    SET 
                        in_period = ${inPeriod},
                        free_period_end='${_endPeriod}'
                    WHERE id='${findedOrderRes.rows[0].id}'`)
                }
            }

            if (connetedQueryRes.rows.length > 0) {
                const userId = connetedQueryRes.rows[0].user_id;

                // find order by message
                const syncAt = moment().utcOffset(0, true).format('YYYY-MM-DD HH:mm:ss');
                const settingsSettingsQuery = (
                    `SELECT data.seller_settings.order_timer FROM data.seller_settings
                                        LEFT JOIN data.live_sessions ON data.live_sessions.user_id=data.seller_settings.user_id
                                        WHERE data.live_sessions.id = '${findedOrderRes.rows[0].live_sessions_id}'`);
                const settingsSettingsRes = await client.query(settingsSettingsQuery);
                let expireAt;
                if (settingsSettingsRes.rows[0].order_timer.hours) {
                   expireAt = moment().utcOffset(0, true).add(settingsSettingsRes.rows[0].order_timer.hours, 'hours').format('YYYY-MM-DD HH:mm:ss');
                }
                if (settingsSettingsRes.rows[0].order_timer.days) {
                   expireAt = moment().utcOffset(0, true).add(settingsSettingsRes.rows[0].order_timer.days, 'days').format('YYYY-MM-DD HH:mm:ss');
                }
                if (settingsSettingsRes.rows[0].order_timer.minutes) {
                    expireAt = moment().utcOffset(0, true).add(settingsSettingsRes.rows[0].order_timer.minutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');
                }
                await client.query(`UPDATE data.orders
                    SET user_id='${userId}',
                        sync_at='${syncAt}',
                        expire_order_at='${expireAt}'
                    WHERE id='${findedOrderRes.rows[0].id}'`);

                // remove fake user
                await client.query(`DELETE FROM data.users WHERE id='${fakeUserId}'`);


                // check if we have non payed order
                const existNonPayedOrder = await client.query(
                    `SELECT data.orders.id, data.orders.order_number, 
                                        data.orders.order_amount, data.orders.total_amount,
                                        data.orders.live_sessions_id FROM data.orders 
                                        LEFT JOIN data.live_sessions ON data.live_sessions.id = data.orders.live_sessions_id
                                        LEFT JOIN data.user_stores ON data.user_stores.id = data.live_sessions.store_id   
                                        WHERE data.orders.user_id='${userId}'
                                        AND data.orders.status='new' AND data.orders.id != '${findedOrderRes.rows[0].id}'
                                        AND live_sessions_id='${findedOrderRes.rows[0].live_sessions_id}' 
                                        AND status_waiting IS NULL`);
                let orderId, orderNumber;
                if (existNonPayedOrder.rows[0]?.id) {
                    orderNumber = existNonPayedOrder.rows[0].order_number;
                    orderId = existNonPayedOrder.rows[0].id;

                    // before add new items check if this item already aexist in order, if yes only change quantity
                    const updateExistItemsSQL = `UPDATE data.order_items SET 
                        order_id='${orderId}' 
                        WHERE order_id='${findedOrderRes.rows[0].id}' AND status IS NULL `;
                    await client.query(updateExistItemsSQL);

                    //remove row from data.orders cuz we change owner for order_items
                    const removeUnusedOrder = `DELETE FROM data.orders 
                        WHERE id='${findedOrderRes.rows[0].id}'`;
                    await client.query(removeUnusedOrder);

                    const orderItemsSQL = `SELECT * FROM data.order_items WHERE order_id='${orderId}'`;
                    const orderItemsRes = await client.query(`SELECT price, quantity FROM data.order_items WHERE order_id='${orderId}'`);
                    let totalItemsAm = 0;
                    orderItemsRes.rows.forEach(_item => {
                        totalItemsAm += _item.price*_item.quantity;
                    })

                    const updateAmountSQL = `UPDATE data.orders 
                        SET order_amount = ${totalItemsAm},
                        total_amount = ${totalItemsAm},
                        expire_order_at='${expireAt}',
                        sync_at=now(),
                        in_period = ${inPeriod}
                        WHERE id='${orderId}'`;
                    await client.query(updateAmountSQL);
                    if (inPeriod) {
                        await client.query(`UPDATE data.orders SET
                            free_period_end=${moment(freePeriodEnd).format('YYYY-MM-DD hh:mm:ss')}
                            WHERE id='${orderId}'`)
                    }
                }
            }
            return { success: true };
        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error:',
                    { message: e.message }
                );
            }
            return {success: false, error: e.message };
        } finally {
            client.release();
        }
    }

    /**
     * if time end mark order as expired and update waiting items
     *
     * @param orderId - integer
     * @param userId - integer
     * @returns {Promise<{success: boolean, error}>}
     */
    async expireOrder(orderId, userId) {
        const client = await pool.connect();
        try {
            const order = await client.query(`SELECT * FROM data.orders WHERE id='${orderId}' 
                    AND user_id='${userId}' AND status !='expired' AND expire_order_at <= NOW()`);
            if (order.rows.length > 0) {
                await client.query(`UPDATE data.orders SET total_amount = 0, order_amount=0, expire_order_at=now(), status='expired' WHERE id=${order.rows[0].id}`)
                const sessionId = order.rows[0].live_sessions_id;
                const orderItems = await client.query(`SELECT * FROM data.order_items WHERE order_id='${order.rows[0].id}'`);
                if (orderItems.rows.length > 0) {
                    orderItems.rows.forEach(async _item => {
                        // put qty back to product
                        await client.query(`UPDATE data.product_configurations SET quantity=quantity+${parseInt(_item.quantity)} WHERE id=${_item.product_configuration_id}`);
                        // remove item
                        await client.query(`DELETE FROM data.order_items WHERE id='${_item.id}'`);

                        // start wait job
                        shell.exec(`pm2 start ../BE/storeJobs/jobStoreWaiting.js --name "jobStoreWaiting ${_item.product_configuration_id}" -- configId=${_item.product_configuration_id}`, function(code, output) {
                            console.log('Exit code:', code);
                            console.log('Program output:', output);
                        });
                    });
                }
            }
        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error:',
                    { message: e.message }
                );
            }
            return {success: false, error: e.message };
        } finally {
            client.release();
        }
    }

    /**
     * Connect link  from fb messenger with order in db
     *
     * @param commentId - integer
     * @param userId - integer
     * @returns {Promise<{success: boolean, error}|{orderNumber, orderId, success: boolean, storeName}>}
     */
    async findByCommentId (commentId, userId) {
        const client = await pool.connect();
        try {
            let orderNumber;let orderId;let copyOrderData;let storeName;let sessionId;
            const SQL = `SELECT order_id, order_number, data.order_items.status, data.orders.id AS orderId, data.order_items.user_id AS tmp_user_id,
                        data.orders.live_sessions_id, order_amount, total_amount, 
                        quantity, data.order_items.user_id AS tmp_user, data.user_stores.name AS store_name
                                FROM data.order_items 
                                LEFT JOIN data.orders ON data.orders.id = data.order_items.order_id
                                LEFT JOIN data.live_sessions ON data.live_sessions.id = data.orders.live_sessions_id
                                LEFT JOIN data.user_stores ON data.user_stores.id = data.live_sessions.store_id
                                WHERE message_id='${commentId}' ORDER BY order_id`;
            const res = await client.query(SQL);
            orderNumber = res.rows[0].order_number;
            storeName = res.rows[0].store_name;
            sessionId = res.rows[0].live_sessions_id;
            const tmpUserId = res.rows[0].tmp_user;
            const fakeUserId = res.rows[0].tmp_user;

            if (!orderNumber) {
                const SQLWait = `SELECT *
                                FROM data.order_items 
                                WHERE message_id='${commentId}' ORDER BY order_id`;
                const resWait = await client.query(SQLWait);
                let updateTotal = 0;
                if (!resWait.rows[0].order_id) {
                    const existNonPayed = await client.query(
                        `SELECT * FROM data.orders 
                        WHERE status='new' AND user_id='${userId}' 
                        AND total_amount > 0 ORDER BY created_at DESC`);
                    if (existNonPayed.rows.length > 0) {
                        orderId = existNonPayed.rows[0].id;
                        orderNumber = existNonPayed.rows[0].order_number;
                    } else {
                        const existNonPayedEmpty = await client.query(
                            `SELECT * FROM data.orders WHERE status='new' AND user_id='${userId}' 
                            ORDER BY created_at DESC`);
                        if (existNonPayedEmpty.rows.length > 0) {
                            orderId = existNonPayedEmpty.rows[0].id;
                            orderNumber = existNonPayedEmpty.rows[0].order_number;
                        } else {
                            const emptyWaitRes = await client.query(
                                `SELECT id, order_number, user_id, updated_at,
                                    live_sessions_id FROM data.orders WHERE user_id='${tmpUserId}'`);
                            orderId = emptyWaitRes.rows[0].id;

                            orderNumber = emptyWaitRes.rows[0].order_number;
                            const syncAt = moment().utcOffset(0, true).format('YYYY-MM-DD HH:mm:ss');
                            const settingsSettingsQuery =
                                `SELECT data.seller_settings.order_timer,  data.seller_settings.free_shipping_to,
                                        data.seller_settings.free_shipping_from
                                        FROM data.seller_settings
                                        LEFT JOIN data.live_sessions ON data.live_sessions.user_id=data.seller_settings.user_id
                                        WHERE data.live_sessions.id = '${emptyWaitRes.rows[0].live_sessions_id}'`;
                            const settingsSettingsRes = await client.query(settingsSettingsQuery);
                            let expireAt;
                            if (settingsSettingsRes.rows[0].order_timer.hours) {
                                expireAt = moment().utcOffset(0, true).add(settingsSettingsRes.rows[0].order_timer.hours, 'hours').format('YYYY-MM-DD HH:mm:ss');
                            }
                            if (settingsSettingsRes.rows[0].order_timer.days) {
                                expireAt = moment().utcOffset(0, true).add(settingsSettingsRes.rows[0].order_timer.days, 'days').format('YYYY-MM-DD HH:mm:ss');
                            }
                            if (settingsSettingsRes.rows[0].order_timer.minutes) {
                                expireAt = moment().utcOffset(0, true).add(settingsSettingsRes.rows[0].order_timer.minutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');
                            }
                            const forattedDate = moment(emptyWaitRes.rows[0].updated_at).format('YYYY-MM-DD hh:mm:ss');
                            const dateFrom = moment(settingsSettingsRes.rows[0].free_shipping_from).format('YYYY-MM-DD hh:mm:ss');
                            const dateTo = moment(settingsSettingsRes.rows[0].free_shipping_to).format('YYYY-MM-DD hh:mm:ss');

                            const inPeriod = forattedDate >= dateFrom && forattedDate <= dateTo;
                            let updtQuery;
                            if (settingsSettingsRes.rows[0].free_shipping_to) {
                                updtQuery = `UPDATE data.orders 
                                SET user_id=${userId}, 
                                total_amount=${resWait.rows[0].quantity*resWait.rows[0].price}, 
                                order_amount=${resWait.rows[0].quantity*resWait.rows[0].price},
                                order_number='${orderNumber}',
                                sync_at='${syncAt}',
                                expire_order_at='${expireAt}',
                                in_period=${inPeriod},
                                free_period_end='${moment(settingsSettingsRes.rows[0].free_shipping_to).format('YYYY-MM-DD hh:mm:ss')}'
                                WHERE id=${emptyWaitRes.rows[0].id}`;
                            } else {
                                updtQuery = `UPDATE data.orders 
                                SET user_id=${userId}, 
                                total_amount=${resWait.rows[0].quantity*resWait.rows[0].price}, 
                                order_amount=${resWait.rows[0].quantity*resWait.rows[0].price},
                                order_number='${orderNumber}',
                                sync_at='${syncAt}',
                                expire_order_at='${expireAt}'
                                WHERE id=${emptyWaitRes.rows[0].id}`;
                            }
                            await client.query(updtQuery);

                            // remove fake user
                            if (userId !== fakeUserId) {
                                await client.query(`DELETE FROM data.users WHERE id='${fakeUserId}'`)
                            }

                            await client.query(`UPDATE data.order_items 
                                SET order_id=${emptyWaitRes.rows[0].id} WHERE user_id=${tmpUserId}`
                            );
                        }
                    }
                    if (resWait.rows.length > 0) {
                        for (const _item of resWait.rows) {
                            if (!_item.order_id) {
                                updateTotal += _item.price*_item.quantity;
                                await client.query(`UPDATE data.order_items 
                                    SET order_id = ${orderId} WHERE message_id='${commentId}'`);
                            }
                        }
                    }
                }
                return {success: true, orderId: orderId, orderNumber: orderNumber, storeName: storeName };

            } else {
                const _tmpOrderNumber = res.rows[0].order_number.split('-');
                const prefixWait = Math.floor(Date.now()/1000);
                copyOrderData = res.rows[0];
                copyOrderData.order_number = `${res.rows[0].order_number}-WO-${prefixWait}`;
                orderId = res.rows[0].orderId;
                const existNonPayedOrder = await client.query(
                    `SELECT data.orders.id, data.orders.order_number, data.orders.live_sessions_id FROM data.orders 
                                     LEFT JOIN data.live_sessions ON data.live_sessions.id = data.orders.live_sessions_id
                                        LEFT JOIN data.user_stores ON data.user_stores.id = data.live_sessions.store_id   
                                        WHERE data.orders.user_id='${userId}'
                                        AND data.orders.status='new' AND data.orders.id != '${res.rows[0].order_id}'
                                        AND live_sessions_id='${res.rows[0].live_sessions_id}' AND status_waiting IS NULL`);
                if (existNonPayedOrder.rows[0]?.id) {
                    orderNumber = existNonPayedOrder.rows[0].order_number;
                    orderId = existNonPayedOrder.rows[0].id;
                    // before add new items check if this item already aexist in order, if yes only change quantity
                    const updateExistItemsSQL = `UPDATE data.order_items SET 
                        order_id='${existNonPayedOrder.rows[0].id}' WHERE message_id='${commentId}' AND status IS NULL `;
                    await client.query(updateExistItemsSQL);
                    // update amounts for order splited order
                    const updateAmountSQL = `UPDATE data.orders 
                        SET order_amount = order_amount + ${res.rows[0].order_amount},
                        total_amount = total_amount +  ${res.rows[0].total_amount},
                        sync_at=now()
                        WHERE id='${existNonPayedOrder.rows[0].id}'`;
                    await client.query(updateAmountSQL);

                    // delete unused order
                    await client.query(`DELETE FROM data.orders  WHERE id='${res.rows[0].order_id}'`);
                    // remove fake user
                    await client.query(`DELETE FROM data.users WHERE id='${tmpUserId}'`);

                    // combined same rows in order_items
                    const combinedSQL = await client.query(`
                        SELECT product_configuration_id, SUM(quantity) AS resultsQty
                        FROM data.order_items
                        WHERE order_id=${existNonPayedOrder.rows[0]?.id}
                        GROUP BY product_configuration_id`);
                    const realOrderItems = await client.query(`SELECT id 
                    FROM data.order_items WHERE order_id=${existNonPayedOrder.rows[0]?.id}`);
                    // need to combine two rows into one
                    if (combinedSQL.rows.length < realOrderItems.rows.length) {
                        const combinedData = [];
                        combinedSQL.rows.forEach(_item => {
                            combinedData.push({config_id: _item.product_configuration_id, qty: _item.resultsqty})
                        })
                        const _dataResCombine = await client.query(`SELECT product_configuration_id, 
                        SUM(quantity) AS resultsQty, array_agg(id) as products
                        FROM data.order_items
                        WHERE order_id=${existNonPayedOrder.rows[0]?.id}
                        GROUP BY product_configuration_id;`)
                        _dataResCombine.rows.forEach(_row => {
                            if (_row.products.length > 1) {
                                _row.products.forEach(async (_itemId, _key) => {
                                    console.log(_key)
                                    if (_key > 0) {
                                        await client.query(`DELETE FROM data.order_items WHERE id='${_itemId}'`);
                                    }
                                })
                            }
                        });
                        // update quantity for order items row
                        combinedData.forEach(async (_item) => {
                            await client.query(`UPDATE data.order_items SET quantity='${_item.qty}' 
                        WHERE product_configuration_id='${_item.config_id}'`)
                        });
                    }
                } else {
                    let nOrderNumber = sessionId+'-'+res.rows[0].order_number;
                    const settingsSettingsQuery = (
                        `SELECT data.seller_settings.order_timer FROM data.seller_settings 
                                        LEFT JOIN data.live_sessions ON data.live_sessions.user_id=data.seller_settings.user_id
                                        WHERE data.live_sessions.id = '${sessionId}'`);
                    const settingsSettingsRes = await client.query(settingsSettingsQuery);
                    let expireAt;

                    if (settingsSettingsRes.rows[0].order_timer.hours) {
                        expireAt = moment().utcOffset(0, true).add(settingsSettingsRes.rows[0].order_timer.hours, 'hours').format('YYYY-MM-DD HH:mm:ss');
                    }
                    if (settingsSettingsRes.rows[0].order_timer.days) {
                        expireAt = moment().utcOffset(0, true).add(settingsSettingsRes.rows[0].order_timer.days, 'days').format('YYYY-MM-DD HH:mm:ss');
                    }
                    if (settingsSettingsRes.rows[0].order_timer.minutes) {
                        expireAt = moment().utcOffset(0, true).add(settingsSettingsRes.rows[0].order_timer.minutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');
                    }

                    orderId = res.rows[0].order_id;
                    const orderSQL = `UPDATE data.orders SET user_id='${userId}', 
                        sync_at=now(), expire_order_at='${expireAt}',
                        total_amount=order_amount WHERE id='${res.rows[0].order_id}'`;
                    await client.query(orderSQL);

                    const fromQuery = `SELECT data.order_items.message_id, 
                        data.live_sessions_messages.from_id, data.live_sessions.store_id,
                        data.live_sessions_messages.real_from_id  
                        FROM data.order_items
                        LEFT JOIN data.live_sessions_messages ON 
                            data.live_sessions_messages.message_id = data.order_items.message_id
                        LEFT JOIN data.live_sessions ON data.live_sessions.id = data.live_sessions_messages.live_sessions_id
                        WHERE order_id='${res.rows[0].order_id}'
                        LIMIT 1`;
                    const fromQueryRes = await client.query(fromQuery);
                    const connQeryUserStoreQuery = `SELECT * FROM data.user2pages WHERE 
                        from_id='${fromQueryRes.rows[0].from_id}' AND user_id='${userId}' AND 
                        store_id='${fromQueryRes.rows[0].store_id}'`;
                    const connQeryUserStoreQueryRes = await client.query(connQeryUserStoreQuery);
                    if (connQeryUserStoreQueryRes.rows.length === 0) {
                        if (fromQueryRes.rows[0].from_id && fromQueryRes.rows[0].from_name !== 'EMPTY_FROM') {
                            const insertQueryConnect =
                                `INSERT INTO data.user2pages (from_id, user_id, store_id) VALUES 
                            ('${fromQueryRes.rows[0].from_id}', '${userId}', '${fromQueryRes.rows[0].store_id}')
                            `;
                            await client.query(insertQueryConnect)
                        }
                    }
                    const oData = await client.query(`SELECT order_number FROM data.orders WHERE id='${res.rows[0].order_id}'`);
                    const combineOrderNumber = sessionId+'-'+oData.rows[0].order_number.replace(sessionId+'-', '');
                    await client.query(`UPDATE data.orders SET order_number='${combineOrderNumber}' WHERE id='${res.rows[0].order_id}'`);
                    orderNumber = combineOrderNumber;
                }

                // find waiting products in order
                const waitingItems = await client.query(`SELECT * FROM data.order_items WHERE
                message_id='${commentId}' AND status='waiting'`);

                // create separate order for each wait item
                waitingItems.rows.forEach(async (_item, key) => {
                    const insertOrder = await client.query(`INSERT INTO data.orders
                    (user_id, live_sessions_id, order_amount, total_amount, order_number, status, status_waiting)
                    VALUES ('${userId}', '${copyOrderData.live_sessions_id}', ${_item.price},
                     ${_item.price}, '${copyOrderData.order_number}', 'waiting', true) RETURNING id;`);

                    // console.log("ITEM CONFIG", _item.configuration);
                    await client.query(`INSERT INTO data.order_items (order_id, message_id, product_id,
                                    product_configuration_id, color_id, size_id, price, quantity, status,
                                    configuration, user_id, live_sessions_id) VALUES (
                                    ${insertOrder.rows[0].id}, '${_item.message_id}',
                                    '${_item.product_id}', '${_item.product_configuration_id}',
                                    '${_item.color_id}', '${_item.size_id}',
                                    ${_item.price}, ${_item.quantity}, 'waiting',
                                    '${JSON.stringify(_item.configuration)}', ${userId}, ${_item.live_sessions_id}

                )`);
                    await client.query(`DELETE FROM data.order_items WHERE id=${_item.id}`);
                })

                await client.query(`UPDATE data.orders SET waiting_products='${JSON.stringify(waitingItems.rows)}' WHERE id=${orderId}`)
                // remove fake user
                await client.query(`DELETE FROM data.users WHERE id='${tmpUserId}'`);

                return {success: true, orderId: orderId, orderNumber: orderNumber, storeName: storeName };
            }
            // console.log(orderNumber);
        } catch (e) {
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error:',
                    { message: e.message }
                );
            }
            return {success: false, error: e.message };
        } finally {
            client.release();
        }
    }

    /**
     * Buld downloads orders pdf
     *
     * @param ids - array
     * @param user - object
     * @param locale - string
     * @returns {Promise<{success: boolean, error}|{success: boolean, achive: string, error: null}>}
     */
    async bulkDownload(ids, user, locale) {
        const client = await pool.connect();
        try {
            const promisesQueries = [];
            ids.forEach(async (id) => {
                const order = await client.query(`SELECT * FROM data.orders WHERE id=${id};`);
                promisesQueries.push(this.generatePdf(order.rows[0].order_number, user.id, user, locale, 'download'));
            });
            if (promisesQueries.length) {
                await Promise.all(promisesQueries);
            }
            await setTimeout(4000);
            const tmpTime = Date.now();
            try {
                await zipLib.zip(`${process.env.DOWNLOAD_FOLDER}/orders/${user.id}/${locale}/download`, `${process.env.DOWNLOAD_FOLDER}/achives/${user.id}_${tmpTime}.zip`);

                // clear download folder
                fs.readdir(`${process.env.DOWNLOAD_FOLDER}/orders/${user.id}/${locale}/download`, (err, files) => {
                    if (err) throw err;

                    for (const file of files) {
                        fs.unlink(path.join(`${process.env.DOWNLOAD_FOLDER}/orders/${user.id}/${locale}/download`, file), (err) => {
                            if (err) throw err;
                        });
                    }
                });

            } catch (e) {
                console.log(e.message)
            }
            await setTimeout(4000);
            return {
                success: true,
                error: null,
                achive: `${process.env.API_URL}${process.env.DB_DOWNLOAD_FOLDER}/achives/${user.id}_${tmpTime}.zip`
            };
        } catch (e) {
            console.log(e.message)
            if (process.env.NODE_ENV === 'development') {
                logger.log(
                    'error',
                    'Model error:',
                    { message: e.message }
                );
            }
            return {success: false, error: e.message };
        } finally {
            client.release();
        }
    }
}



export default new Order();
