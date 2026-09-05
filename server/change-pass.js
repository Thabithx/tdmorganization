const mongoose = require('mongoose');
const User = require('./models/User');

const DIRECT_URI = "mongodb://thabith2222_db_user:jvondinaI3ibYovo@ac-jygcvau-shard-00-00.faso4gd.mongodb.net:27017,ac-jygcvau-shard-00-01.faso4gd.mongodb.net:27017,ac-jygcvau-shard-00-02.faso4gd.mongodb.net:27017/frost?ssl=true&replicaSet=atlas-13vbx4-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

(async () => {
  try {
    await mongoose.connect(DIRECT_URI);
    
    const email = 'joyshanjith09@gmail.com';
    const newPassword = 'joy123';
    
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log(`Error: User with email ${email} not found in the database.`);
      process.exit(1);
    }
    
    user.passwordHash = newPassword;
    await user.save();
    
    console.log(`SUCCESS: Password for ${email} has been updated to "${newPassword}"`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
