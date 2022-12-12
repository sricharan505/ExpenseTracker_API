const { buildSchema } = require('graphql');

module.exports = buildSchema(`

    
    type category{
        category: String!
        subcategories:[String]!
    }

    type typedata{
        categories: [category],
        entries: [String]
    }

    input postcategory{
        categoryname: String!
        subcategories:[String]
    }

    input entry{
        value: Float!,
        type: String!,
        category: String!,
        subcategory: String,
        desc: String,
        date: Int!
    }

    input editentry{
        id: String!,
        value: Float!,
        type: String!,
        category: String!,
        subcategory: String,
        desc: String,
        date: Int
    }

    input getentries{
        type: String!,
        category: String,
        subcategory: String,
        startdate: Int,
        enddate: Int
    }

    type entryout{
        id: String!,
        value: Float!,
        type: String!,
        category: String!,
        subcategory: String,
        desc: String,
        date: Int
    }

    type loggeduser{
        jwt: String,
        username: String,
        email: String,
        acctype: String,
        isloggedin: Boolean!
    }

    type RootQuery{
        login(email:String!,password:String!):loggeduser
        getType(type:String!) : typedata
        getCategories(type : String!): [category]
        getEntries(conditions:getentries):[entryout]
    }

    type RootMutation{
        addCategory(type : String!, category : postcategory): Boolean
        addEntry(entry:entry!): Boolean
        deleteEntry(id: String!): Boolean
        editEntry(entry:editentry!) : Boolean
    }

    schema{
        query : RootQuery
        mutation : RootMutation
    }
`);