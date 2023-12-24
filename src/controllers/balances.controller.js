const { Op } = require("sequelize");
const Profile = require("../models/profile");
const Contract = require("../models/contract");
const Job = require("../models/job");
const sequelize = require("../config/database");

const depositMoney = async (req, res) => {
  const userId = req.params.userId;
  const { id, type } = req.profile;
  const amountToDeposit = req.body.amount;

  if (id != userId) {
    return res.status(403).json({ error: 'Only self deposit allowed' });
  }

  if (type === 'contractor') {
    return res.status(403).json({ error: 'Only clients can deposit' });
  }

  const client = await Profile.findOne({ where: { id: userId } });

  if (!client) {
    return res.status(404).json({ error: 'No client found' });
  }

  try {
    const sumOfUnpaidJobs = await Job.sum('price', {
      where: {
        paid: false,
      },
      include: {
        model: Contract,
        where: {
          ClientId: userId,
        },
      },
    });

    const depositLimit = sumOfUnpaidJobs / 4;

    if (amountToDeposit > depositLimit) {
      return res.status(403).json({ error: 'Amount exceeds limit for deposit' });
    }

    await sequelize.transaction(async (t) => {
      await client.update({ balance: client.balance + amountToDeposit }, { transaction: t });
    });

    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Transaction Failed' });
  }
};

module.exports = {
  depositMoney
};
