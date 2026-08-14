import AppError from "../utils/appError.js"

export async function tenant(req,res,next) {
    if(!req.user.orgId){
        return next(new AppError('Org id didnt exists!','Not Found', 404))
    }
    req.orgId = req.user.orgId
    next();
}