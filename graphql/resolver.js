var ObjectId = require('mongodb').ObjectID;
const jwt = require("jsonwebtoken");
const User = require('../Models/User');
const Entry = require("../Models/Entry");
const { Decimal128 } = require('mongodb');
const { isType } = require('graphql');

function hasDuplicates(array) {
    var valuesSoFar = Object.create(null);
    for (var i = 0; i < array.length; ++i) {
        var value = array[i].toLowerCase();
        if (value in valuesSoFar) {
        return true;
        }
        valuesSoFar[value] = true;
    }
    return false;
}

module.exports = {
    //signup
    signup: async ()=>{

    },

    //login
    login: async ({email,password},req)=>{

        // console.log("email ",email," password ",password);
        
        if(!email || !password)
        {
            const error = new Error('Credentials  missing');
            throw error;
        }

        let user = await User.find({email:email});
        user = user[0];
        // console.log(user);
        if(!user)
        {
            const error = new Error("User not found, please Sign up.");
            throw error;
        }
        else if(user.password === password)// ahvqytwfjavuytfwdqa
        {
            const token = await jwt.sign(
                { userId: user._id.valueOf()},
                process.env.signsecret,
                { expiresIn: "1d"}
            );

            return {
                jwt: token,
                username: user.name,
                email: user.email,
                acctype: user.acctype,
                isloggedin:true
            }
        }
        else
        {
            const error = new Error("Wrong Password");
            throw error;
        }

    },

    // Get type
    getType: async ({type},req) => {
        const user = await User.findById(req.userId);
        if(!user)
        {
            const error = new Error('User not found!');
            throw error;
        }

        // Check is type is present
        if(!user[type])
        {
            const error = new Error("wrong type");
            throw error;
        }
        
        return  user[type];
    },

    // Get all categories
    getCategories: async ({type},req) => {
        //console.log(type);
        const user = await User.findById(req.userId);
        if(!user)
        {
            const error = new Error('User not found!');
            throw error;
        }

        // Check is type is present
        
        if(!user[type])
        {
            const error = new Error("wrong type");
            throw error;
        }
        
        return  user[type].categories;
    },

    // Add category
    addCategory: async ({type,category},req) => {
        // console.log(category.categoryname, category.subcategories);

        // Find the user
        const user = await User.findById(req.userId);
        if(!user)
        {
            const error = new Error('User not found!');
            throw error;
        }

        //check if category not present or empty
        console.log(category.categoryname);
        if (category.categoryname === "") {
            const error = new Error("Category cannot be empty");
            throw error;
        }

        // check if category already exists and if no of category is equal to limit
        if(user[type].categories)
        {
            if(user[type].categories.length === 10)
            {
                const error = new Error("Max no of categories present");
                throw error;
            }

            user[type].categories.map((c)=> {
                if (
                    c.category.toLowerCase() === category.categoryname.toLowerCase()
                ) {
                    const error = new Error("Category already exists");
                    throw error;
                }
            });

            // Check if subcategories has a duplicate and no of subcat is less than 6
            if(category.subcategories)
            {
                if(category.subcategories.length > 5)
                {
                    const error = new Error("Max no of subcategories allowed is 5");
                    throw error;
                }
                if(hasDuplicates(category.subcategories))
                {
                    const error = new Error("Subcategories have duplicates");
                    throw error;
                }
            }
        }

        // add the category and save
        user[type].categories = [
            ...user[type].categories,
            {
                category: category.categoryname,
                subcategories: category.subcategories || [],
            },
        ];
        await user.save();

        return true;
    },

    // Edit category
    editCategory: async ({type,oldcategory,newcategory},req) => {

        // Find the user
        const user = await User.findById(req.userId);
        if(!user)
        {
            const error = new Error('User not found!');
            throw error;
        }

        //check the type
        if(!(type==='expense' || type==='income' || type==='investment'))
        {
            const error = new Error("Invalid type");
            throw error;
        }
        
        // Check if newcategory is already present
        user[type].categories.map((c)=>{
            if(c.category === newcategory)
            {
                const error = new Error('newcategory already present');
                throw error;
            }
        })

        // Check if oldcategory is present 
        // and Rename oldcategory to newcategory in user
        let iscategory = false;
        user[type].categories.map((c)=>{
            if(c.category === oldcategory)
            {
                c.category = newcategory;
                iscategory = true;
            }
        })
        if(!iscategory)
        {
            const error = new Error("Category not found!");
            throw error;
        }
        await user.save()
        
        // Rename oldcategory to newcategory in entries
        await Entry.updateMany(
            { type:type, category:oldcategory, userid:req.userId },
            { category: newcategory }
        );
        
        return true;
    },

    // Delete category
    deleteCategory: async ({type,category},req) => {

        // Find the user
        const user = await User.findById(req.userId);
        if(!user)
        {
            const error = new Error('User not found!');
            throw error;
        }

        //check the type
        if(!(type==='expense' || type==='income' || type==='investment'))
        {
            const error = new Error("Invalid type");
            throw error;
        }

        // Check if category is present
        // and delete category from user
        let iscategory = false;
        user[type].categories = user[type].categories.filter((c) => {
            if (c.category === category) {
                iscategory = true;
                return false;
            }
            return true;
        });
        if(!iscategory)
        {
            const error = new Error("Category not found!");
            throw error;
        }

        // Save user
        await user.save();

        // delete entries with category
        await Entry.deleteMany({
            type:type,
            category: category,
            userid:req.userId
        });  
        
        return true;
    },

    // Add subcategory
    addSubcategory: async ({type,category,subcategory},req) => {

        // check if subcategory is empty
        if(subcategory === "")
        {
            const error = new Error("subcategory cannot be empty");
            throw error;
        }

        // Find the user
        const user = await User.findById(req.userId);
        if(!user)
        {
            const error = new Error('User not found!');
            throw error;
        }

        //check the type
        if(!(type==='expense' || type==='income' || type==='investment'))
        {
            const error = new Error("Invalid type");
            throw error;
        }

        // check if category exists
        let usercategory = null;
        user[type].categories.map((c)=>{
            if(c.category===category)
            {
                usercategory = c;
            }
        })
        if(usercategory === null)
        {
            const error = new Error("Category not found");
            throw error;
        }

        //check if subcategory already exists
        usercategory.subcategories.map((s)=>{
            if(s===subcategory)
            {
                const error = new Error("Subcategory already present");
                throw error;
            }
        })

        //check if max no of subcategories are present
        if(usercategory.subcategories.length === 5)
        {
            const error = new Error("Max no of subcategories allowed is 5");
            throw error;
        }

        // If category already has entries without subcategories, deny adding subcategory.
        if(usercategory.subcategories.length === 0)
        {
            let isentry = null;
            isentry = await Entry.findOne({type:type,category:category,userid:req.userId})
            if(isentry !== null)
            {
                const error = new Error("Entries without subcategory found");
                throw error;
            }
        }

        // add the subcategory and save
        usercategory.subcategories.push(subcategory);
        await user.save();

        return true;
    },

    // Edit subcategory
    editSubcategory: async ({type,category,oldsubcategory,newsubcategory},req) => {
        
        // Find the user
        const user = await User.findById(req.userId);
        if(!user)
        {
            const error = new Error('User not found!');
            throw error;
        }

        //check the type
        if(!(type==='expense' || type==='income' || type==='investment'))
        {
            const error = new Error("Invalid type");
            throw error;
        }

        // check if category is present
        let usercategory = null;
        user[type].categories.map((c)=>{
            if(c.category===category)
            {
                usercategory = c;
            }
        })
        if(usercategory === null)
        {
            const error = new Error("Category not found");
            throw error;
        }

        // Check if newsubcategory is already present
        usercategory.subcategories.map(s=>{
            if(s===newsubcategory)
            {
                const error = new Error("newsubcategory already present");
                throw error;
            }
        })
        
        // Check if oldsubcategory is present
        // and Rename oldsubcategory to newsubcategory in user
        let ispresent = false;
        usercategory.subcategories.forEach((s,i)=>{
            if(s===oldsubcategory)
            {
                ispresent = true;
                usercategory.subcategories[i] = newsubcategory;
            }
        })
        if(!ispresent)
        {
            const error = new Error("oldsubcategory not found");
            throw error;
        }
        await user.save();
        
        // Rename oldsubcategory to newsubcategory in entries
        await Entry.updateMany(
            { type:type, category:category,subcategory:oldsubcategory,userid:req.userId },
            { subcategory:newsubcategory }
        );

        return true;
    },

    // Delete subcategory
    deleteSubcategory: async ({type,category,subcategory},req) => {

        // Find the user
        const user = await User.findById(req.userId);
        if(!user)
        {
            const error = new Error('User not found!');
            throw error;
        }

        //check the type
        if(!(type==='expense' || type==='income' || type==='investment'))
        {
            const error = new Error("Invalid type");
            throw error;
        }

        // check if category is present
        let usercategory = null;
        user[type].categories.map((c)=>{
            if(c.category===category)
            {
                usercategory = c;
            }
        })
        if(usercategory === null)
        {
            const error = new Error("Category not found");
            throw error;
        }
        
        // Check if subcategory is present
        // and Delete subcategory in user
        let ispresent = false;
        usercategory.subcategories = usercategory.subcategories.filter((s) => {
            if (s === subcategory) 
            {
                ispresent = true;
                return false;
            }
            return true;
        });
        if(!ispresent)
        {
            const error = new Error("subcategory not found");
            throw error;
        }
        await user.save();
        
        // Rename oldsubcategory to newsubcategory in entries
        await Entry.deleteMany(
            { type:type, category:category,subcategory:subcategory,userid:req.userId }
        );

        return true;
    },

    // Get entries
    getEntries: async ({conditions},req) => {

        // Find the user
        const user = await User.findById(req.userId);
        if(!user)
        {
            const error = new Error('User not found!');
            throw error;
        }
        //console.log(conditions);

        let iscategory = false;
        let issubcategory = false;
        let isstartdate = false;
        let isenddate = false;

        //check if startdate is passed
        const startdate = conditions.startdate;
        if(startdate)
        {
            isstartdate = true;
        }

        //check if end date is passed
        const enddate = conditions.enddate;
        if(enddate)
        {
            isenddate = true;
        }

        // Check is type is present
        const type = conditions.type;
        if(!user[type])
        {
            const error = new Error("wrong type");
            throw error;
        }
        let istype = true;
        
        //check if category is present
        const category = conditions.category;
        let subcategory;
        if(category)
        {
            let ispresent = false;
            let subcategoryarray;
            user[type].categories.forEach( c => {
                if(c.category === category)
                {
                    subcategoryarray = c.subcategories;
                    ispresent = true;
                }
            })
            if(!ispresent)
            {
                const error = new Error("category not present");
                throw error;
            }
            iscategory = true;
            
            //check if sub-category is present
            subcategory = conditions.subcategory;
            if(subcategory)
            {
                
                ispresent = false;
                subcategoryarray.forEach( s => {
                    if(s === subcategory)
                    {
                        ispresent = true;
                    }
                })
                if(!ispresent)
                {
                    const error = new Error("subcategory not present");
                    throw error;
                }
                issubcategory = true;
            }
        }

        //console.log(type,category,subcategory,startdate,enddate);

        let out = [];
        // provide data when start time and end time is provided
        if(isstartdate && isenddate)
        {   
            if(istype)
            {
                if(iscategory)
                {
                    if(issubcategory)
                    {
                        out = await Entry.find({
                            $and:[
                                {date:{$lte:enddate}},
                                {date:{$gte:startdate}},
                                {type:type},
                                {category:category},
                                {subcategory:subcategory},
                                {userid:req.userId}
                            ]
                        },{__v:0,userid:0});
                    }
                    else
                    {
                        out = await Entry.find({
                            $and:[
                                {date:{$lte:enddate}},
                                {date:{$gte:startdate}},
                                {type:type},
                                {category:category},
                                {userid:req.userId}
                            ]
                        },{__v:0,userid:0});
                    }
                }
                else
                {
                    out = await Entry.find({
                            $and:[
                                {date:{$lte:enddate}},
                                {date:{$gte:startdate}},
                                {type:type},
                                {userid:req.userId}
                            ]
                        },{__v:0,userid:0});
                }
            }
            else
            {
                out = await Entry.find({
                            $and:[
                                {date:{$lte:enddate}},
                                {date:{$gte:startdate}},
                                {userid:req.userId}
                            ]
                        },{__v:0,userid:0});
            }
        }
        // provide data when start time or end time is provided
        else if(isstartdate || isenddate)
        {
            if(istype)
            {
                if(iscategory)
                {
                    if(issubcategory)
                    {
                        out = await Entry.find({
                            $and:[
                                {date:startdate},
                                {type:type},
                                {category:category},
                                {subcategory:subcategory},
                                {userid:req.userId}
                            ]
                        },{__v:0,userid:0});
                    }
                    else
                    {
                        out = await Entry.find({
                            $and:[
                                {date:startdate},
                                {type:type},
                                {category:category},
                                {userid:req.userId}
                            ]
                        },{__v:0,userid:0});
                    }
                }
                else
                {
                    out = await Entry.find({
                            $and:[
                                {date:startdate},
                                {type:type},
                                {userid:req.userId}
                            ]
                        },{__v:0,userid:0});
                }
            }
            else
            {
                out = await Entry.find({
                    $and:[{userid:req.userId},{"date":pdate}]
                },{__v:0,userid:0});
            }
        }
        // If both dates are not provided, fetch all.
        else 
        {
            if(istype)
            {
                if(iscategory)
                {
                    if(issubcategory)
                    {
                        out = await Entry.find({
                            $and:[
                                {type:type},
                                {category:category},
                                {subcategory:subcategory},
                                {userid:req.userId}
                            ]
                        },{__v:0,userid:0});
                    }
                    else
                    {
                        out = await Entry.find({
                            $and:[
                                {type:type},
                                {category:category},
                                {userid:req.userId}
                            ]
                        },{__v:0,userid:0});
                    }
                }
                else
                {
                    out = await Entry.find({
                            $and:[
                                {type:type},
                                {userid:req.userId}
                            ]
                        },{__v:0,userid:0});
                }
            }
            else
            {
                out = await Entry.find({userid:req.userId}, { __v: 0, userid: 0 });
            }
        }
        
        return out;
    },

    //Get an entry
    getEntry: async ({id},req) => {

    },

    // Add an entry
    addEntry: async ({entry},req) => {
        const user = await User.findById(req.userId);
        if(!user)
        {
            const error = new Error('User not found');
            throw error;
        }

        //console.log(entry);

        const value = parseFloat(entry.value);
        if(isNaN(value))
        {
            const error = new Error("Value not a number");
            throw error;
        }

        const type = entry.type;
        if(!user[type])
        {
            const error = new Error("wrong type");
            throw error;
        }
        
        const category = entry.category;
        let ispresent = false;
        let subcategoryarray;
        user[type].categories.forEach( c => {
            //console.log(c.category + " " + category);
            if(c.category === category)
            {
                subcategoryarray = c.subcategories;
                ispresent = true;
                
            }
        })
        if(!ispresent)
        {
            const error = new Error("category not present");
            throw error;
        }

        const subcategory = entry.subcategory;
        if(subcategory)
        {
            ispresent = false;
            subcategoryarray.forEach( s => {
                if(s === subcategory)
                {
                    ispresent = true;
                }
            })
            if(!ispresent)
            {
                const error = new Error("subcategory not present");
                throw error;
            }
        }

        const desc = entry.desc;
        const date = entry.date;

        let newentry;
        if(subcategory)
        {
            newentry = new Entry({
                value:value,
                type:type,
                category:category,
                subcategory:subcategory,
                desc:desc,
                date:date,
                userid:req.userId
            });
        }
        else
        {
            newentry = new Entry({
                value:value,
                type:type,
                category:category,
                desc:desc,
                date:date,
                userid:req.userId
            });
        }
        user[type].total = user[type].total + value;
        await newentry.save();
        await user.save();

        return true;
    },

    // Delete an entry
    deleteEntry: async ({id},req) => {
        const user = await User.findById(req.userId);
        if(!user)
        {
            const error = new Error('User not found!');
            throw error;
        }

        const entry = await Entry.findById(id);
        const response = await Entry.deleteOne({_id:id,userid:req.userId})
        //console.log(response);
        if (response.deletedCount === 0)
            return false;
        user[entry.type].total -= entry.value;
        user.save();
        return true;
    },

    // Edit an entry
    editEntry: async ({entry},req) => {
        const user = await User.findById(req.userId);
        if(!user)
        {
            const error = new Error('User not found');
            throw error;
        }
        
        // See if ID is present
        const id = entry.id;
        if(!id)
        {
            const error = new Error("ID required");
            throw error;
        }

        const searchentry = await Entry.findById(id);
        if(searchentry === null)
        {
            const error = new Error("Entry not found");
            throw error;
        }
        
        // If entry was not created by user, deny permission
        if(searchentry.userid.valueOf() !== req.userId)
        {
            //console.log(searchentry.userid.valueOf(), req.userId);
            const error = new Error("Permission denied");
            throw error;
        }


        const value = parseFloat(entry.value);
        if(isNaN(value))
        {
            const error = new Error("Value not a number");
            throw error;
        }

        const type = entry.type;
        if(!user[type])
        {
            const error = new Error("wrong type");
            throw error;
        }
        
        const category = entry.category;
        let ispresent = false;
        let subcategoryarray;
        user[type].categories.forEach( c => {
            //console.log(c.category + " " + category);
            if(c.category === category)
            {
                subcategoryarray = c.subcategories;
                ispresent = true;
                
            }
        })
        if(!ispresent)
        {
            const error = new Error("category not present");
            throw error;
        }

        const subcategory = entry.subcategory;
        if(subcategory)
        {
            ispresent = false;
            subcategoryarray.forEach( s => {
                if(s === subcategory)
                {
                    ispresent = true;
                }
            })
            if(!ispresent)
            {
                const error = new Error("subcategory not present");
                throw error;
            }
        }

        const desc = entry.desc;
        const date = entry.date;

        if(subcategory)
        {
            await Entry.findByIdAndUpdate(id, { 
                value:value,
                category:category,
                subcategory: subcategory,
                desc: desc,
                date:date
            })
        }
        else
        {
            await Entry.findByIdAndUpdate(id, { 
                value:value,
                category:category,
                desc: desc,
                date:date
            })
        }
        const oldentry = searchentry.value;
        if (oldentry > value)
        {
            user[type].total = user[type].total - (oldentry - value);           
        } 
        else if (oldentry < value)
        {
            user[type].total = user[type].total + (value - oldentry);
        }
        
        await user.save();
        return true;
    },

    //get totals of all types
    getTotals: async ({},req)=>{

        // get the user
        const user = await User.findById(req.userId);
        //console.log(req.userId);
        if(!user)
        {
            const error = new Error('User not found');
            throw error;
        }
        //console.log("totals");
        return {
            expense: user.expense.total,
            income: user.income.total,
            investment: user.investment.total,
        };
    }
}

