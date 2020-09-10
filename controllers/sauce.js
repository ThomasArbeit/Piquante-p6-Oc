const Sauce = require('../models/sauce');
const fs = require('fs');
const { json } = require('body-parser');

exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    delete sauceObject._id;
    const sauce = new Sauce({
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: [],
        usersDisliked: []
    });
    sauce.save()
        .then(() => res.status(201).json({ message: 'Sauce correctement créée !'}))
        .catch(error => res.status(400).json({ error }));
}

exports.modifySauce = (req, res, next) => {
    const sauceObject = req.file ?
        {
            ...JSON.parse(req.body.sauce),
            imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id})
        .then(() => res.status(200).json({ message: 'Sauce modifiée !'}))
        .catch(error => res.status(400).json({error}));
}

exports.deleteSauce = (req, res, next) =>{
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            const filename = sauce.imageUrl.split('/images/')[1];
            fs.unlink(`images/${filename}`, () => {
                Sauce.deleteOne({ _id: req.params.id })
                    .then(() => res.status(200).json({ message : 'Sauce supprimée !'}))
                    .catch(error => res.status(400).json({error}));
            })
        })
        .catch(error => res.status(500).json({error}));
    
};

exports.getOneSauce = (req, res, next) => {
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => res.status(200).json(sauce))
        .catch(error => res.status(404).json({error}));
};

exports.getAllSauces = (req, res, next) => {
    Sauce.find()
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(400).json({error}));
};

exports.likeSauce = (req, res, next) => {
    if (req.body.like === 1) {
        Sauce.updateOne({ _id: req.params.id}, {$inc: {likes:1}, $set: {usersLiked: req.body.userId},  _id: req.params.id})
        .then(() => res.status(200).json({ message: 'Sauce liked !'}))
        .catch( error => res.status(400).json({ error }));
    } else if (req.body.like === -1) {
        Sauce.updateOne({ _id: req.params.id}, { $inc: {dislikes: 1}, $set: {usersDisliked: req.body.userId}, _id: req.params.id})
        .then(() => res.status(200).json({ message: 'Sauce disliked !'}))
        .catch( error => res.status(400).json({ error }));
    } else if (req.body.like === 0){
        Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (sauce.usersLiked.includes(req.body.userId)){
                Sauce.updateOne({ _id: req.params.id}, { $inc: {likes: -1 }, $pull: {usersLiked: req.body.userId}, _id: req.params.id})
                .then(() => res.status(200).json({ message: 'Annulation du like !'}))
                .catch( error => res.status(400).json({ error }));
            } else if (sauce.usersDisliked.includes(req.body.userId)){
                Sauce.updateOne({ _id: req.params.id}, { $inc: {dislikes: -1 }, $pull: {usersDisliked: req.body.userId}, _id: req.params.id})
                .then(() => res.status(200).json({ message: 'Annulation du dislike !'}))
                .catch( error => res.status(400).json({ error }));
            } else {
                return res.status(400).json({ message: 'Vous ne pouvez pas faire un vote nul !'})
            }
        })
        .catch( error => res.status(500).json({ error }));
    }
}
