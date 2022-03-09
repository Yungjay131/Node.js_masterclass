/* middleware for handling pagination for any resource */

const getResults = (model, populate) => async (req,res,next) =>{
   //add all the code

   if(populate)
     query = query.populate(populate);
   res.results = {
       success: true,
       count: results.length,
       pagination,
       data: results
   }
}; 

module.exports = getResults;