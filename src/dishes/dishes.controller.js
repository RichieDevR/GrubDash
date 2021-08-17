const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");


const priceCheck = (req,res,next) => {
    if (typeof req.body.data.price!=="number"||req.body.data.price <= 0) {
        return next({
          status: 400,
          message: "dish must have a price that is an integer greater than 0",
        });
      }
      next();
}




const hasRequiredFields = (req, res, next) => {
  const data = req.body.data || {};
  const requiredFields = ["name", "description", "price", "image_url"];
  for (const field of requiredFields) {
    if (!data[field]) {
      return next({
        status: 400,
        message: `Dish must include a ${field}`,
      });
    }
  }
  res.locals.data = data;
  next();
};
const dishExists = (req, res, next) => {
  const { dishId } = req.params;
  const dish = dishes.find((d) => d.id === dishId);

  if (!dish) {
    return next({
      status: 404,
      message: "Not Found",
    });
  }
  res.locals.dish = dish;
  next();
};

const list = (req, res) => {
  res.json({ data: dishes });
};

const create = (req, res, next) => {
  const { data: { name, description, price, image_url } = {} } = req.body;
const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };

  dishes.push(newDish);
  res.status(201).json({ data: newDish });
};

const read = (req, res) => {
    const dish = res.locals.dish;
  res.status(200).json({ data: dish });
};

const update = (req, res, next) => {
const dish = res.locals.dish;
  const dishUpdate = { 
      ...dish,
    ...res.locals.data,  
    };
   if(dishUpdate.id === null|| dishUpdate.id === ""){
    dishUpdate.id = dish.id;
   }else if(dishUpdate.id !== req.params.dishId){ 
    return next({
           status: 400,
           message:"Could not find dish with id " + dishUpdate.id
       })
   }
    
//dishes = dishes.map((d)=>d.id===dishUpdate.id?dishUpdate:d)
for (let i = 0; i < dishes.length; i++) {
    if(dishes[i].id===dishUpdate.id){
        dishes[i]=dishUpdate;
        break;
    }
}
res.status(200).json({ data: dishUpdate });
}
module.exports = {
  list,
  create: [priceCheck,hasRequiredFields,create],
  read: [dishExists, read],
  update: [dishExists,priceCheck,hasRequiredFields, update],
};
