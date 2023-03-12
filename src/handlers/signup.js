const fetch = require("node-fetch")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HASURA_OPERATION = `
mutation ($firstname: String!, $lastname: String!, $password: String!, $gender: String!) {
  insert_users_one(object: {
    firstname: $firstname,
    lastname: $lastname,
    password: $password,
    gender: $gender
  }) {
    id
  }
}
`;

const HASURA_OPERATION_SUB = `
mutation ($user_id: Int!, $lat: String!, $long: String!) {
  insert_users_tracking_one(object: {
    user_id: $user_id,
    lat: $lat,
    long: $long
  }) {
    id
  }
}
`;

// execute the parent mutation in Hasura
const execute = async (variables, reqHeaders) => {
  const fetchResponse = await fetch(
    "http://localhost:8080/v1/graphql",
    {
      method: 'POST',
      headers: reqHeaders || {},
      body: JSON.stringify({
        query: HASURA_OPERATION,
        variables
      })
    }
  );
  return await fetchResponse.json();
};
  
// execute the parent mutation in Hasura
const execute_sub = async (variables, reqHeaders) => {
  console.log(variables);
  const fetchResponse = await fetch(
    "http://localhost:8080/v1/graphql",
    {
      method: 'POST',
      headers: reqHeaders || {},
      body: JSON.stringify({
        query: HASURA_OPERATION_SUB,
        variables
      })
    }
  );
  return await fetchResponse.json();
};

// Request Handler
const handler = async (req, res) => {

  // get request input
  const { firstname, lastname, password, gender, lat, long} = req.body.input;

  // run some business logic
  let hashedPassword = await bcrypt.hash(password, 10);

  // execute the Hasura operation
  const { data, errors } = await execute({ firstname, lastname, password: hashedPassword, gender }, req.headers);

  const user_id = data.insert_users_one.id
   
  // execute the Hasura operation
  const { data : data_sub, errors: errors_sub } = await execute_sub({ user_id, lat, long }, req.headers);

  // if Hasura operation errors, then throw error
  if (errors || errors_sub) {
    return res.status(400).json({
      message: errors?.message || errors_sub?.message
    })
  }
  

  const tokenContents = {
    sub: data.insert_users_one.id.toString(),
    firstname: firstname,
    iat: Date.now() / 1000,
    iss: 'https://myapp.com/',
    "https://hasura.io/jwt/claims": {
      "x-hasura-allowed-roles": ["user"],
      "x-hasura-user-id": data.insert_users_one.id.toString(),
      "x-hasura-default-role": "user",
      "x-hasura-role": "user"
    },
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
  }

  const token = jwt.sign(tokenContents, "KQya4EG7F9Z7EvFVIYsMcTd2OSzvOfvm_COspJXlzZS9ntFwZdhWfikN48YTSYDX");

  // success
  return res.json({
    ...data.insert_users_one, ...data_sub.insert_users_tracking_one,
    token: token
  })

}

module.exports = handler;