const express = require('express');
const  { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

const customers = [];


// middleware
function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;
  // const { cpf } = request.params;

  // verificar se há um cpf cadastrado 
  const customer = customers.find(customer => customer.cpf === cpf);

  // verificar se cliente foi encontrado
  if(!customer) {
    return response.status(400).json({ error: "Customer not found!" });
  }

  // criando um customer a partir do request
  request.customer = customer;

  return next();
}

// função de balance 
const getBalance = (statement) => {
  // usando o método reduce
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit') {
      return acc + operation.amount;
    } 
    else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}


// criar uma conta
app.post('/accounts', (request, response) => {
  const { name, cpf } = request.body;

  // verificar pelo cpf se já existe o cliente
  const customersAlreadyExists = customers.
    some(customer => customer.cpf === cpf);

  // imprimir mensagem de erro
  if (customersAlreadyExists) {
    return response.status(400).json({
      error: "Customer already exists!"
    })
  }

  // adicionar cliente no array
  customers.push({
    name,
    cpf,
    id: uuidv4(),
    statement:[]
  })

  // retornar resposta de sucesso
  return response.status(201).send();
})

// atualizar nome do cliente na conta
app.put('/account', verifyIfExistsAccountCPF, (request, response)=> {
  const { customer } = request;
  const { name } = request.body;

  customer.name = name;

  return response.status(200).send();

})

// buscar contas cadastradas
app.get('/account', verifyIfExistsAccountCPF, (request, response)=> {
  const { customer } = request;

  return response.json(customer);
})

// deletar um conta
app.delete('/account', verifyIfExistsAccountCPF, (request, response)=> {
  const { customer } = request;

  customers.splice(customer, 1);

  return response.status(200).json(customers);
})



// buscar o statement do cliente através do cpf, usando o middleware
app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request; 
  
  // retornar o statement do cliente
  return response.json(customer.statement);
})

// criar um depósito
app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;

  // pegando nosso customer do request
  const { customer } = request;

  // criando operação de statement
  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  // adicionando nossa operação no statement
  customer.statement.push(statementOperation);

  return response.status(201).send();
})

// criar um saque na conta
app.post('/withdraw', verifyIfExistsAccountCPF, (request, response)=> {
  const { amount } = request.body;
  const { customer } = request;

  // atribuindo o valor retornado pelo getBalance
  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "Insufficient funds!"})
  }

  const customerOperation = {
    amount,
    created_at: new Date(),
    type: "debit"
  }

  // adicionando o saque ao statement
  customer.statement.push(customerOperation);

  return response.status(201).send();

})

// buscar o statement através da data
app.get('/statement/date', verifyIfExistsAccountCPF, (request, response)=> {
  const { customer } = request;
  const { date } = request.query;

  const dateFormat = new Date(date + " 00:00");

  // filtrando o statement pela data
  const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString());

  return response.json(statement);

})


// retornando o saldo que ficou na conta
app.get('/balance', verifyIfExistsAccountCPF, (request, response)=> {
  const { customer } = request;

  const balance = getBalance(customer.statement);

  return response.json(balance);
})





// porta do servidor
app.listen(3000, ()=> console.log("Server it's running!")); 