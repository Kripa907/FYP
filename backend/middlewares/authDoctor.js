// import jwt from 'jsonwebtoken'
// import doctorModel from '../models/doctorModel.js';

// export const authDoctor = async (req, res, next) => {
//     try{
//         const {dtoken} = req.headers

//         if(!dtoken){
//             return res.json({success:false,message:"Not Authorized Login Again"})
//         }

//         const token_decode = jwt.verify(dtoken,process.env.JWT_SECRET)
//         req.body.docId = token_decode.id
//         //callback function

//         next()

//     }catch (error) {
//         console.log(error)
//         res.json({success:false,message:error.message})
//     }
// }

// export const verifyDoctor = async (req, res, next) => {
//   const token = req.header('dtoken');
//   if (!token) return res.status(401).json({ message: "Access Denied" });

//   try {
//     const verified = jwt.verify(token, process.env.JWT_SECRET);
//     const doctor = await doctorModel.findById(verified.id);
//     if (!doctor) return res.status(401).json({ message: "Doctor not found" });

//     req.doctor = doctor;
//     next();
//   } catch (err) {
//     res.status(401).json({ message: "Invalid Token" });
//   }
// }

import jwt from 'jsonwebtoken';
import doctorModel from '../models/doctorModel.js';

const authDoctor = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false,
                message: 'No token provided or invalid format' 
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const doctor = await doctorModel.findById(decoded.id);
        
        if (!doctor) {
            return res.status(404).json({ 
                success: false,
                message: 'Doctor not found' 
            });
        }

        req.doctor = doctor;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ 
            success: false,
            message: 'Not authorized' 
        });
    }
};

const verifyDoctor = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false,
                message: 'Access Denied - No token provided' 
            });
        }

        const token = authHeader.split(' ')[1];
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const doctor = await doctorModel.findById(verified.id);
        
        if (!doctor) {
            return res.status(401).json({ 
                success: false,
                message: 'Doctor not found or unauthorized' 
            });
        }

        req.doctor = doctor;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ 
            success: false,
            message: 'Invalid token' 
        });
    }
};

export { authDoctor, verifyDoctor };
