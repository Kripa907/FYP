// import jwt from 'jsonwebtoken'

// //admin authentication middleware

// const authUser = async (req, res, next) => {
//     try{

//         const {token} = req.headers

//         if(!token){
//             return res.json({success:false,message:"Not Authorized Login Again"})
//         }

//         const token_decode = jwt.verify(token,process.env.JWT_SECRET)
//         req.body.userId = token_decode.id


//         //callback function

//         next()

//     }catch (error) {
//         console.log(error)
//         res.json({success:false,message:error.message})
//     }

// }

// export default authUser

import jwt from 'jsonwebtoken'

const authUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: "Not Authorized Login Again" 
            });
        }

        const token = authHeader.split(' ')[1];
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        
        // Store user info in req.user
        req.user = { _id: token_decode.id };
        next();

    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ 
            success: false, 
            message: "Not Authorized Login Again" 
        });
    }
}

export default authUser