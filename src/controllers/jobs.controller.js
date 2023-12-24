const { Op } = require("sequelize");
const Contract = require("../models/contract");
const Job = require("../models/job");
const Profile = require("../models/profile");
const sequelize = require("../config/database");

const getUnpaidJobs = async (req, res) => {
    const {id, type} = req.profile;
    let filter;
    if(type === 'contractor') {
        filter = {
            ContractorId: id,
            status: { [Op.in]: ['in_progress'] },
            '$Jobs.paid$': {[Op.eq]: false}
        }
    }
    else if(type === 'client'){
        filter = {
            ClientId: id,
            status: { [Op.in]: ['in_progress'] },
            '$Jobs.paid$': {[Op.eq]: false}
        }
    }
    const contracts = await Contract.findAll({
        attributes: ['id', 'ClientId', 'ContractorId', 'status'],
        where: filter,
        include: Job
    });
    if (contracts.length === 0) return res.status(404).json({ error: 'Jobs not found' });
    res.json(contracts);
};


const payForJob = async (req, res) => {
    const jobId = req.params.job_id;
    const { id: clientId, type } = req.profile;
    if(type === 'contractor') return res.status(403).json({ error: 'Only clients can pay for a job' });
    
    const job = await Job.findOne({ where: { id: jobId }, include: Contract });
    if(!job) return res.status(404).json({ error: 'Job not found' });
    if(job.paid) return res.status(403).json({ error: 'Job already paid' });

    try {

        await sequelize.transaction(async (t) => {

            const contractorId = job.Contract.ContractorId;
            const jobPrice = job.price;
            const [contractor, client] = await Promise.all([
                Profile.findOne({ where: { id: contractorId } }, { transaction: t }),
                Profile.findOne({ where: { id: clientId } }, { transaction: t })
            ]);

        if(jobPrice > client.balance) return res.status(403).json({ error: 'Insufficient balance' });

            await contractor.update({ balance: contractor.balance + jobPrice }, { transaction: t });
            await client.update({ balance: client.balance - jobPrice }, { transaction: t });
            await job.update({ paid: true, paymentDate: Date.now() }, { transaction: t });
        });
        res.json(job);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Transaction Failed' });
    }
};


module.exports = {
    getUnpaidJobs,
    payForJob
};