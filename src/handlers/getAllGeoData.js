const fetch = require("node-fetch")
const bcrypt = require('bcryptjs');
const url = 'http://localhost:8080/v1/graphql'

const HL_OPERATION = `
query GetUsersTracking {
  users_tracking {
    id,
    location
  }
}
`;


// methodExecute the parent mutation in Hasura
const methodExecute = async (reqHeaders) => {
  const fetchRes = await fetch(
    url,
    {
      method: 'POST',
      headers: reqHeaders || {},
      body: JSON.stringify({
        query: HL_OPERATION
      })
    }
  );
  return await fetchRes.json();
};
  
 
// Request Handler
const alHandler = async (req, res) => {

  // get request input
  const { radios} = req.body.input;

   
  // methodExecute the Hasura operation
  const { data, errors } = await methodExecute(req.headers);

  const user_id = data.insert_users_one.id
   
  // methodExecute the Hasura operation
  const { data : data_sub, errors: errors_sub } = await methodExecuteSub({ user_id, lat, long }, req.headers);

  // GEO Location logic {
    // and return data
  // }

  // if Hasura operation errors, then throw error
  if (errors || errors_sub) {
    return res.status(400).json({
      message: errors?.message || errors_sub?.message
    })
  }
  
 
  // success
  return res.json({
    // return location filter data
  })

}

module.exports = alHandler;