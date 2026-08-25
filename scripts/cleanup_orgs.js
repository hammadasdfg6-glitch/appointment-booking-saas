import 'dotenv/config';
import dns from 'dns';

// Ensure Google/Cloudflare public DNS for reliable SRV record resolution
dns.setServers(['8.8.8.8', '1.1.1.1']);

import mongoose from 'mongoose';
import { Org } from '../src/models/org.model.js';
import { User } from '../src/models/user.model.js';
import { Service } from '../src/models/service.model.js';
import { Booking } from '../src/models/booking.model.js';
import { Slots } from '../src/models/slots.model.js';
import Availability from '../src/models/availability.model.js';
import { Revenue } from '../src/models/revenue.model.js';
import { Stats } from '../src/models/stats.model.js';

const TARGET_ORG_ID = '6a7eaf67d2fcc184cc6a96fb';

async function runCleanup() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set in environment variables!');
    process.exit(1);
  }

  console.log('Connecting to MongoDB Atlas Cluster...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected successfully!\n');

  const keepId = new mongoose.Types.ObjectId(TARGET_ORG_ID);

  // 1. Verify Target Organization Exists
  const preservedOrg = await Org.findById(keepId);
  if (!preservedOrg) {
    console.error(`ERROR: Target organization with ID ${TARGET_ORG_ID} was not found! Aborting deletion.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log('================ PRESERVED ORGANIZATION ================');
  console.log(`ID:         ${preservedOrg._id}`);
  console.log(`Name:       ${preservedOrg.name}`);
  console.log(`Slug:       ${preservedOrg.slug}`);
  console.log(`Owner:      ${preservedOrg.ownerName} (${preservedOrg.ownerEmail})`);
  
  const preservedUsers = await User.find({ orgId: keepId });
  const preservedUserIds = preservedUsers.map(u => u._id);
  console.log(`Preserved Users (${preservedUsers.length}):`);
  preservedUsers.forEach(u => console.log(`  - [${u.role.toUpperCase()}] ${u.name} (${u.email}) - ID: ${u._id}`));
  console.log('========================================================\n');

  // 2. Perform Deletions for all other organizations
  const filter = { orgId: { $ne: keepId } };
  const orgFilter = { _id: { $ne: keepId } };
  const slotsFilter = { staffId: { $nin: preservedUserIds } };

  console.log('Deleting other organizations and their associated data...');

  const deletedOrgs = await Org.deleteMany(orgFilter);
  const deletedUsers = await User.deleteMany(filter);
  const deletedServices = await Service.deleteMany(filter);
  const deletedBookings = await Booking.deleteMany(filter);
  const deletedSlots = await Slots.deleteMany(slotsFilter);
  const deletedAvailability = await Availability.deleteMany(filter);
  const deletedRevenue = await Revenue.deleteMany(filter);
  const deletedStats = await Stats.deleteMany(filter);

  console.log('\n================ DELETION SUMMARY ================');
  console.log(`Organizations Deleted:  ${deletedOrgs.deletedCount}`);
  console.log(`Users Deleted:          ${deletedUsers.deletedCount} (owners, staff, customers)`);
  console.log(`Services Deleted:       ${deletedServices.deletedCount}`);
  console.log(`Bookings Deleted:       ${deletedBookings.deletedCount}`);
  console.log(`Slots Deleted:          ${deletedSlots.deletedCount}`);
  console.log(`Availability Deleted:   ${deletedAvailability.deletedCount}`);
  console.log(`Revenue Records Deleted:${deletedRevenue.deletedCount}`);
  console.log(`Stats Records Deleted:  ${deletedStats.deletedCount}`);
  console.log('==================================================\n');

  // 3. Final Verification
  const remainingOrgs = await Org.find({});
  const remainingUsers = await User.find({});
  console.log(`Verification: Remaining Organizations in DB: ${remainingOrgs.length}`);
  console.log(`Verification: Remaining Users in DB:         ${remainingUsers.length}`);

  await mongoose.disconnect();
  console.log('\nDatabase connection closed. Cleanup complete!');
}

runCleanup().catch(err => {
  console.error('Fatal cleanup error:', err);
  process.exit(1);
});
