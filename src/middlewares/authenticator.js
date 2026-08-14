import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import catchAsync from "../utils/catchAsync.js"
import AppError from "../utils/appError.js"

export const Authentication = catchAsync(async(req,res,next) => {
    
    const token = req.cookies.token

    if(!token){
    const error =  new Error('Token not found!')
        error.status = false
        error.statusCode = 401
        return next(error)
    }
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET)
        req.user = decode
        next();
    } catch (err) {
        const error = new Error('Invalid or expired token!')
        error.status = false
        error.statusCode = 401
        return next(error)
    }
})

export  function authorize(...roles) {
    return function (req,res,next) {
        if(!roles.includes(req.user.role)){
            return next(new AppError('You are not Authorized to do this','Unauthorized',403))
        }
        next();
    }
}

