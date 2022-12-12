var ObjectId = require('mongodb').ObjectID;
const jwt = require("jsonwebtoken");
const User = require('../Models/User');
const Entry = require("../Models/Entry");
const { Decimal128 } = require('mongodb');

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

    // Add categories
    addCategory: async ({type,category},req) => {
        // console.log(category.categoryname, category.subcategories);

        // Find the user
        const user = await User.findById(req.userId);
        if(!user)
        {
            const error = new Error('User not found!');
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
            await Promise.all(user[type].entries.map(async (e) => {
            const entry = await Entry.find({
                $and:[{_id:e},
                {date:{$lte:enddate}},
                {date:{$gte:startdate}}]
            },{__v:0});
            //console.log(entry);
            entry[0] && out.push(entry[0]);
            }));
        }
        // provide data when start time or end time is provided
        else if(isstartdate || isenddate)
        {
            const pdate = isstartdate?startdate:enddate;
            
            await Promise.all(user[type].entries.map(async (e) => {
            const entry = await Entry.find({
                $and:[{"_id":e},{"date":pdate}]
            },{__v:0});
            //console.log("single ",entry);
            entry[0] && out.push(entry[0]);
            }));
        }
        // If both dates are not provided, fetch all.
        else 
        {
            await Promise.all(user[type].entries.map(async (e) => {
            const entry = await Entry.findById(e,{__v:0});
            //console.log(entry);
            out.push(entry);
            }));
        }

        // Filter category if present
        if(iscategory)
        {
            out = out.filter((e)=>{
                // filter subcategory if present
                if(issubcategory && e.category === category && e.subcategory === subcategory)
                {   
                    return true;
                }
                else if( !issubcategory && e.category === category)
                {
                    return true;
                }
                else
                {
                    return false;
                }
            });  
        }

        //console.log(out);
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
                date:date
            });
        }
        else
        {
            newentry = new Entry({
                value:value,
                type:type,
                category:category,
                desc:desc,
                date:date
            });
        }
        

        const savedentry = await newentry.save();
        user[type].entries.push(savedentry);
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

        const response = await Entry.findByIdAndRemove(id).clone().catch((err) => {
            const error = new Error("Some Error occured");
            throw error;
        });

        if (response == null)
            return false;

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
        // console.log(user);
        // console.log(entry);

        const id = entry.id;
        if(!id)
        {
            const error = new Error("ID required");
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

        // check if the entry was created by the user editing it
        let containsid = false;
        for(enid in user[type].entries)
        {
            //console.log(user[type].entries[enid].valueOf(), id);
            if(user[type].entries[enid].valueOf() === id)
            {
                containsid = true;
            }
        }
        if(!containsid)
        {
            const error = new Error("entry not created by user");
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

        let modentry;
        if(subcategory)
        {
            modentry = await Entry.findByIdAndUpdate(id, { 
                value:value,
                category:category,
                subcategory: subcategory,
                desc: desc,
                date:date
            })
        }
        else
        {
            modentry = await Entry.findByIdAndUpdate(id, { 
                value:value,
                category:category,
                desc: desc,
                date:date
            })
        }
        

        const savedentry = await modentry.save();
        
        return true;
    },
}

