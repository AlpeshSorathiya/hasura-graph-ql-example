const fetch = require("node-fetch")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HASURA_OPERATION = `
query GetUsersTracking {
  users_tracking {
    id,
    location
  }
}
`;


// execute the parent mutation in Hasura
const execute = async (reqHeaders) => {
  const fetchResponse = await fetch(
    "http://localhost:8080/v1/graphql",
    {
      method: 'POST',
      headers: reqHeaders || {},
      body: JSON.stringify({
        query: HASURA_OPERATION
      })
    }
  );
  return await fetchResponse.json();
};
  
 
// Request Handler
const handler = async (req, res) => {

  // get request input
  const { radios} = req.body.input;

   
  // execute the Hasura operation
  const { data, errors } = await execute(req.headers);

  const user_id = data.insert_users_one.id
   
  // execute the Hasura operation
  const { data : data_sub, errors: errors_sub } = await execute_sub({ user_id, lat, long }, req.headers);

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

module.exports = handler;