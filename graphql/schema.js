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

    type totaldata{expense:String,income:String,investment:String}

    type RootQuery{
        login(email:String!,password:String!):loggeduser
        getType(type:String!) : typedata
        getCategories(type : String!): [category]
        getEntries(conditions:getentries):[entryout]
        getTotals : totaldata
    }

    type RootMutation{
        addCategory(type : String!, category : postcategory): Boolean
        editCategory(type:String!,oldcategory:String!,newcategory:String!): Boolean
        deleteCategory(type:String!,category:String!):Boolean
        addSubcategory(type: String!, category: String!, subcategory: String!): Boolean
        editSubcategory(type:String!,category: String!,oldsubcategory:String!,newsubcategory:String!): Boolean
        deleteSubcategory(type:String!,category:String!,subcategory:String!): Boolean
        addEntry(entry:entry!): Boolean
        deleteEntry(id: String!): Boolean
        editEntry(entry:editentry!) : Boolean
    }

    schema{
        query : RootQuery
        mutation : RootMutation
    }
`);