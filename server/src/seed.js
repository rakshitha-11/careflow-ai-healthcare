require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("./models/User");
const DoctorProfile = require("./models/DoctorProfile");

const hours = {
  monday:{start:"09:00",end:"17:00",enabled:true}, tuesday:{start:"09:00",end:"17:00",enabled:true},
  wednesday:{start:"09:00",end:"17:00",enabled:true}, thursday:{start:"09:00",end:"17:00",enabled:true},
  friday:{start:"09:00",end:"17:00",enabled:true}, saturday:{start:"09:00",end:"13:00",enabled:false}, sunday:{start:"09:00",end:"13:00",enabled:false}
};
const doctors = [
  {name:"Dr. Ananya Rao",email:"ananya.rao@careflow.demo",specialization:"General Medicine",qualification:"MBBS, MD",experience:8,bio:"Primary care and preventive health consultations."},
  {name:"Dr. Arjun Mehta",email:"arjun.mehta@careflow.demo",specialization:"Cardiology",qualification:"MBBS, DM Cardiology",experience:12,bio:"Heart health, blood pressure and cardiovascular care."},
  {name:"Dr. Mira Nair",email:"mira.nair@careflow.demo",specialization:"Dermatology",qualification:"MBBS, MD Dermatology",experience:9,bio:"Skin, hair and lifestyle-focused dermatology care."}
];
(async()=>{
  await mongoose.connect(process.env.MONGO_URI);
  const adminEmail="admin@careflow.demo", adminPassword="CareFlowAdmin@2026";
  const adminHash=await bcrypt.hash(adminPassword,12);
  await User.findOneAndUpdate({email:adminEmail},{name:"CareFlow Clinic Admin",email:adminEmail,password:adminHash,role:"admin"},{upsert:true,new:true,setDefaultsOnInsert:true});
  for (const d of doctors) {
    const hash=await bcrypt.hash("Doctor@2026",12);
    const user=await User.findOneAndUpdate({email:d.email},{name:d.name,email:d.email,password:hash,role:"doctor"},{upsert:true,new:true,setDefaultsOnInsert:true});
    await DoctorProfile.findOneAndUpdate({userId:user._id},{...d,userId:user._id,slotDuration:30,workingHours:hours,leaveDays:[]},{upsert:true,new:true,setDefaultsOnInsert:true});
  }
  console.log("Seed complete.");
  console.log("Admin: admin@careflow.demo / CareFlowAdmin@2026");
  console.log("Doctors: ananya.rao@careflow.demo, arjun.mehta@careflow.demo, mira.nair@careflow.demo");
  console.log("Doctor password: Doctor@2026");
  await mongoose.disconnect();
})().catch(e=>{console.error(e);process.exit(1)});
