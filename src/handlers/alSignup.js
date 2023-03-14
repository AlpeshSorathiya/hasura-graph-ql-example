const fetch = require("node-fetch")
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const url = 'http://localhost:8080/v1/graphql'

const HL_OPERATION = `
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

const HL_OPERATION_SUB = `
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

// methodExecute the parent mutation in Hasura
const methodExecute = async (variables, reqHeaders) => {
  const fetchRes = await fetch(
    url,
    {
      method: 'POST',
      headers: reqHeaders || {},
      body: JSON.stringify({
        query: HL_OPERATION,
        variables
      })
    }
  );
  return await fetchRes.json();
};

// methodExecute the  parent mutation in Hasura
const methodExecuteSub = async (variables, reqHeaders) => {
  console.log(variables);
  const fetchRes = await fetch(
    url,
    {
      method: 'POST',
      headers: reqHeaders || {},
      body: JSON.stringify({
        query: HL_OPERATION_SUB,
        variables
      })
    }
  );
  return await fetchRes.json();
};

// Request Handler
const alHandler = async (req, res) => {

  // get request input
  const { firstname, lastname, password, gender, lat, long } = req.body.input;

  // run some business logic
  let hashedPassword = await bcrypt.hash(password, 10);

  // methodExecute the Hasura operation
  const { data, errors } = await methodExecute({ firstname, lastname, password: hashedPassword, gender }, req.headers);

  const user_id = data.insert_users_one.id

  // methodExecute the Hasura operation
  const { data: data_sub, errors: errors_sub } = await methodExecuteSub({ user_id, lat, long }, req.headers);

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

  const token = jwt.sign(tokenContents, "SYDX4EG7F9Z7EvFVIYsMcTd2OSzvOfvm_COspJXlzZS9ntFwZdhWfikN48YTSYDX");

  // success
  return res.json({
    ...data.insert_users_one, ...data_sub.insert_users_tracking_one,
    token: token
  })

}

module.exports = alHandler;