const express = require("express");
const mongoose = require("mongoose");
const { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require("./graphql/resolver");
const auth =  require('./middleware/auth');

//Express body parsing
const app = express();
//body parser
app.use(express.json());
//url-encoded body parsing
app.use(express.urlencoded({extended:true}));

// setting access headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader("Access-Control-Allow-Methods", 'GET, POST, PUT, PATCH, DELETE,OPTIONS');
    res.setHeader("Access-Control-Allow-Headers", 'Content-Type, Authorization');
    if(req.method === 'OPTIONS')
    {
        return res.sendStatus(200);
    }
    next();
});

// app.use((req,res,next)=>{
//     req.userId = "638361d3b2e30e8fbac01c3a";
//     //console.log(req.userId);
//     next();
// })

// Auth JWT
app.use(auth);

//Graphql
app.use(
    '/graphql',
    graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolver,
        graphiql: true,
        customFormatErrorFn(err)
        {
            if(!err.originalError)
            {
                return err;
            }
            const data = err.originalError.data;
            const message = err.message || 'An error occurred.';
            const code = err.originalError.code || 500;
            return { message:message, status:code,data:data };
        }
    })
);

// Error handling


app.use((req, res, next) => {
    //console.log(req.body);
    return res.status(200).json({message:"The End"});
});

// Mongoose and server
mongoose
    .connect(
        process.env.DBstring
    )
    .then(app.listen(process.env.PORT || 3000))
    .catch((err) => console.log(err));
