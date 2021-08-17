const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
//validation middleware
const orderExists = (req, res, next) => {
  const { orderId } = req.params;
  const order = orders.find((o) => Number(o.id) === Number(orderId));

  if (order === undefined) {
    return next({
      status: 404,
      message: `Order does not exist: ${orderId}`,
    });
  }
  res.locals.order = order;
  res.locals.orderId = orderId;
  next();
};

function validateStatus(req, res, next) {
  const order = res.locals.order;
  // Only checks the pending status if request is a DELETE request
  if (req.method === "DELETE") {
    if (order.status !== "pending") {
      return next({
        status: 400,
        message: "An order cannot be deleted unless it is pending",
      });
    } else {
      return next();
    }
  }

  //checks to validate value of status if method is not delete
  const status = req.body.data.status;
  const validStatuses = [
    "pending",
    "preparing",
    "out-for-delivery",
    "delivered",
  ];

  if (
    !status ||
    status === undefined ||
    status === "" ||
    !validStatuses.includes(status)
  ) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  }

  if (status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }
  return next();
}

function idMatch(req, res, next) {
  const id = req.body.data.id;
  const orderId = res.locals.orderId;

  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  return next();
}

const validateOrder = (req, res, next) => {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  if (!deliverTo) {
    return next({
      status: 400,
      message: "Order must include a deliverTo",
    });
  }
  if (!mobileNumber) {
    return next({
      status: 400,
      message: "Order must include a mobileNumber",
    });
  }
  if (!dishes) {
    return next({
      status: 400,
      message: "Order must include a dish",
    });
  }
  if (!Array.isArray(dishes) || !dishes.length) {
    return next({
      status: 400,
      message: "Order  must include atleast one dish",
    });
  }
  for (const [index, { quantity } = {}] of dishes.entries()) {
    if (!quantity || typeof quantity !== "number" || quantity <= 0) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  }

  res.locals.validOrder = {};
  if (deliverTo) res.locals.validOrder.deliverTo = deliverTo;
  if (mobileNumber) res.locals.validOrder.mobileNumber = mobileNumber;
  if (dishes) res.locals.validOrder.dishes = dishes;
  next();
};

//CRUD
const list = (req, res) => {
  res.json({ data: orders });
};

const read = (req, res, next) => {
  const foundOrder = res.locals.order;
  res.status(200).json({ data: foundOrder });
};

const create = (req, res, next) => {
  const validOrder = res.locals.validOrder;
  const newData = {
    id: nextId(),
    ...validOrder,
  };
  orders.push(newData);
  res.status(201).json({ data: newData });
};

const update = (req, res, next) => {
  const newData = res.locals.validOrder;
  const orderUp = res.locals.order;
  const newOrder = { ...orderUp, ...newData };

  const vary = orders.findIndex((order) => {
    return order.id === newOrder.id;
  });

  orders[vary] = newOrder;

  res.status(200).json({ data: newOrder });
};

function destroy(req, res, next) {
  orders.splice(orders.indexOf(res.locals.order), 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [validateOrder, create],
  read: [orderExists, read],
  update: [orderExists, idMatch, validateOrder, validateStatus, update],
  delete: [orderExists, validateStatus, destroy],
};
