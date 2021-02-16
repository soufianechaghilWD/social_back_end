import express from 'express'

import Users from '../models/users.js'

const usersRouter = express.Router()

usersRouter.use(express.json())


usersRouter.route('/')
.post((req, res) => {
    const data = req.body
    //Add a new user when signing up
    Users.create(data, (err, response) => {
        if (err){
            res.status(500).send(err)
        }else{
            Users.updateOne(
                {"_id": response._id},
                {$addToSet: {"peopleUserFoll": [response._id]}},
                (err, resul) => {
                    if(err) res.status(406).send(err)
                    else res.status(200).send(resul)
                }
                )
        }
    })
})
.get((req, res) => {
    // Only for Testing
    Users.
    find({}).
    populate('peopleFollUser').
    populate('peopleUserFoll').
    populate("asking").
    exec((err, results) => {
        if(err) res.status(400).send(err)
        else res.status(200).send(results)
    })
})

// Follow a User if account private send an ask 

usersRouter.route('/:wantedId')
.put((req, res) => {
    const data = req.body

    Users.findById(req.params.wantedId, (err, resu) => {
        if(err) res.status(406).send(err)
        else {
            if(!resu.private){
                //Follow if account public
                Users.updateOne(
                    {"_id" : req.params.wantedId},
                    {$addToSet: { peopleFollUser : [data.asker]}},
                    (err, result) => {
                    if(err){
                        res.status(406).send(err)
                    }else{
                        Users.updateOne(
                            {"_id": data.asker},
                            {$addToSet: {peopleUserFoll: [req.params.wantedId]}},
                            (err, results) => {
                            if(err) res.status(406).send(err)
                            else res.status(200).send(results)
                        })
                    }
                })
            }else{
                //Send an Ask if the account private
                Users.updateOne(
                    {"_id": req.params.wantedId},
                    {$addToSet: { asking : [req.body.asker]}}, 
                    (err, results) => {
                    if (err) res.status(406).send(err)
                    else res.status(200).send(results)
                })
            }
        }
    })
    
})


// Accept the Asks for Following if account private

usersRouter.route('/accept/:wantedId')
.put((req, res) => {

    // Add the asker to list of people following the user
    Users.updateOne(
        {"_id": req.params.wantedId},
        {$addToSet: { peopleFollUser : [req.body.asker]}},
        (err, results) => {
        if(err) res.status(406).send(err)
        else{

            // Add the Receiver to list of people the asker follow
            Users.updateOne(
                {"_id": req.body.asker},
                {$addToSet: {peopleUserFoll: [req.params.wantedId]}},
                (err, resul) => {
                if(err) res.status(406).send(err)
                else {
                    
                    // Remove the asker from list of asking
                    Users.updateOne(
                        { '_id' : req.params.wantedId},
                        {$pull: {"asking": req.body.asker}},
                        (err, resull) => {
                        if(err) {
                            res.status(406).send(err)
                        }
                        else {
                            res.status(200).send(resull)
                        }
                    })
                }
            })
        }
    })
})

// Unfollow a user

usersRouter.route('/unfollow/:wantedId')
.put((req, res) => {
    Users.updateOne(
        {"_id": req.body.asker},
        {$pull: {"peopleUserFoll": req.params.wantedId}},
        (err, resu) => {
        if(err) res.status(406).send(err)
        else {
            Users.updateOne(
                {"_id": req.params.wantedId},
                {$pull: {"peopleFollUser": req.body.asker}},
                (err, resul) => {
                    if(err) res.status(406).send(err)
                    else res.status(200).send(resul)
                }
                )
        }
    })
})

// Remove a following request

usersRouter.route('/removerequest/:wantedId')
.put((req, res) => {
    Users.updateOne(
        {"_id": req.params.wantedId},
        {$pull: {"asking": req.body.asker}},
        (err, resu) => {
            if(err) res.status(406).send(err)
            else res.status(200).send(resu)
        }
    )
})

// Update the Account

usersRouter.route('/update/:wantedId')
.put((req, res) => {
    Users.findByIdAndUpdate(
        req.params.wantedId,
        {$set: req.body},
        {new: true},
        (err, resu) => {
            if(err) res.status(406).send(err)
            else res.status(200).send(resu)
        }
        )
})

// Suggestion for new Users

usersRouter.route('/sugg')
.get((req, res) => {
    Users.find((err, resu) => {
        if(err) res.status(406).send(err)
        else {
            // return the first 100 users that are most famous
            res.status(200).send(resu.sort((a, b) => b.peopleFollUser.length - a.peopleFollUser.length).filter(it => String(it._id) !== req.body.asker).slice(0, 100))
        }
    })
})

export default usersRouter
