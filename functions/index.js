const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { database } = require('firebase-functions/lib/providers/firestore');

admin.initializeApp();
const firebase = require('firebase')
let firebaseConfig = {
    apiKey: "AIzaSyDt-ApZVse8xrLcGhvw_J62eF-lxt0ZGm0",
    authDomain: "socialape-abf12.firebaseapp.com",
    databaseURL: "https://socialape-abf12.firebaseio.com",
    projectId: "socialape-abf12",
    storageBucket: "socialape-abf12.appspot.com",
    messagingSenderId: "814845826060",
    appId: "1:814845826060:web:161e0bbd07acaf3c1eca29",
    measurementId: "G-R26FXZN2ZQ"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);


const express = require('express')
const app = express();
const db = admin.firestore()
app.get('/screams', (req, res) => {
    db.collection('screams')
        .orderBy('createdAt', 'desc')
        .get()
        .then(data => {
            let screams = []
            data.forEach(doc => {
                screams.push({
                    screamId: doc.id,
                    body: doc.data().body,
                    userHandle: doc.data().userHandle,
                    createdAt: doc.data().createdAt
                });
            });
            return res.json(screams);
        })
        .catch(err => console.log(err))
})


app.post('/scream', (req, res) => {
    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    }

    db.collection('screams')
        .add(newScream)
        .then((doc) => {
            res.json({ message: `document ${doc.id} created sucessfully` })
        })
        .catch(err => {
            res.status(500).json({ error: "something went wrong." });
            console.log(err)
        })
})

//Signup route
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    }
    // TODO: validate the data
    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if (doc.exists) {
                return res.status(400).json({ handle: 'this handle is already taken.' })
            }
            else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then(idToken => {
            token = idToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            };
            db.doc(`/users/${newUser.handle}`).set(userCredentials);
        })
        .then((data) => {
            return res.status(201).json({ token });
        })
        .catch(err => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ error: "Email is already in use." })
            } else {
                return res.status(500).json({ error: err.code });
            }

        })
})

exports.api = functions.https.onRequest(app); 