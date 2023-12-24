const { Op } = require("sequelize");
const Contract = require("../models/contract");
const Job = require("../models/job");
const Profile = require("../models/profile");
const sequelize = require("../config/database");

const getBestProfession = async (req, res) => {
  const { start, end } = req.query;

  try {
    const jobs = await Job.findAll({
      attributes: ['id', 'price', 'paymentDate'],
      where: {
        paid: true,
        paymentDate: {
          [Op.between]: [start, end],
        },
      },
      include: {
        model: Contract,
        attributes: ['id', 'status'],
        include: {
          model: Profile,
          as: 'Contractor',
          attributes: ['profession'],
        },
      },
    });

    const totalEarningsPerProfession = {};

    for (const job of jobs) {
        const { Contractor } = job.Contract;
        const profession = Contractor.profession;
        const earnings = totalEarningsPerProfession[profession] || 0;
        totalEarningsPerProfession[profession] = earnings + job.price;
    }

    let bestProfession = { profession: null, earnings: 0 };

    for (const [profession, earnings] of Object.entries(totalEarningsPerProfession)) {
        if (earnings > bestProfession.earnings) {
            bestProfession = { profession, earnings };
        }
    }
    res.json({ bestProfession });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const getBestClients = async (req, res) => {
    const { start, end, limit = 2 } = req.query;
  
    try {
      const jobs = await Job.findAll({
        attributes: ['id', 'price'],
        where: {
          paid: true,
          paymentDate: {
            [Op.between]: [start, end],
          },
        },
        include: {
            model: Contract,
            attributes: ['id'],
            include: {
              model: Profile,
              as: 'Client',
              attributes: ['id', 'firstName', 'lastName'],
            },
          },
        });
    
        const totalPaidAmountPerClient = {};

        for (const job of jobs) {
          const { Client } = job.Contract;
          const clientId = Client.id;
          const paidAmount = totalPaidAmountPerClient[clientId] || 0;
          totalPaidAmountPerClient[clientId] = paidAmount + job.price;
        }
  
      const sortedClients = Object.entries(totalPaidAmountPerClient)
        .sort(([, amountA], [, amountB]) => amountB - amountA)
        .slice(0, limit);
  
      const bestClients = sortedClients.map(([clientId, paidAmount]) => {
        const { Contract:{Client} } = jobs.find((job) => job.Contract.Client.id === parseInt(clientId));
        return {
          id: Client.id,
          fullName: Client.firstName + " " + Client.lastName,
          paid: paidAmount,
        };
      });
  
      res.json({ bestClients });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

module.exports = { getBestProfession, getBestClients };
