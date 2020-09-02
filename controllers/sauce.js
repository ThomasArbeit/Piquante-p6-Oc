const Sauce = require('../models/sauce');
const fs = require('fs');

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
    Sauce.findOne({ _id: req.params.id })
        .then(sauce => {
            if (req.body.like === 1) {
                if (sauce.usersLiked.find(id => id == req.body.userId) == undefined){
                    sauce.usersLiked.push(req.body.userId);
                    Sauce.updateOne({ _id: req.params.id}, {
                        sauce,
                        usersLiked: sauce.usersLiked,
                        likes: sauce.usersLiked.length
                    })
                    .then(() => res.status(200).json({ message : 'Sauce appréciée !'}))
                    .catch(error => res.status(400).json({error}));
                } else {
                    return res.status(404).json({ message : 'Sauce déjà likée !'});
                }
                
                
            } else if (req.body.like === -1) {
                if (sauce.usersDisliked.find(id => id == req.body.userId) == undefined){
                    sauce.usersDisliked.push(req.body.userId);
                    Sauce.updateOne({ _id: req.params.id}, {
                        sauce,
                        usersDisliked: sauce.usersDisliked,
                        dislikes: sauce.usersDisliked.length
                    })
                    .then(() => res.status(200).json({ message : 'Sauce non appréciée !'}))
                    .catch(error => res.status(400).json({error}));
                } else {
                    return res.status(404).json({ message : 'Sauce déjà dislikée !'});
                }
                
            } else if (req.body.like === 0) {
                const isLiked = sauce.usersLiked.indexOf(req.body.userId);
                const isDisliked = sauce.usersDisliked.indexOf(req.body.userId);
                if (isLiked != -1){
                    sauce.usersLiked.splice(isLiked, 1);
                    Sauce.updateOne({ _id: req.params.id }, {
                        sauce,
                        usersLiked: sauce.usersLiked,
                        likes: sauce.usersLiked.length
                    })
                    .then(() => res.status(200).json({ message: 'Vous avez enlevé votre like !'}))
                    .catch(error => res.status(400).json({error}));
                } else if (isDisliked != -1){
                    sauce.usersLiked.splice(isDisliked, 1);
                    Sauce.updateOne({ _id: req.params.id}, {
                        sauce,
                        usersDisliked: sauce.usersDisliked,
                        dislikes: sauce.usersDisliked.length
                    })
                    .then(() => res.status(200).json({ message: 'Vous avez enlevé votre dislike !'}))
                    .catch(error => res.status(400).json(error));
                } else {
                    return res.status(404).json({ message: 'Rien n\' a changé ! '})
                }
            }
        })
}