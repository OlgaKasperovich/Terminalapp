const program = require('commander');
const { prompt } = require('inquirer');
const fs=require('fs');
const path = require('path');

program
  .version('0.0.1')
  .description('TODO app');

const StoragePath = path.resolve('./node.json');



function openFile() {
  return new Promise((resolve, reject) => {
    fs.open(StoragePath, 'a+', (err, fd) => {
    if (err) {
      reject(err);
      return;
    }

    resolve(fd);
});
});
}

function readFile() {
  return new Promise((resolve, reject) => {
    fs.readFile(StoragePath, 'utf8', (err, data) => {
    if (err) {
      reject(err);
      return;
    }

    resolve(data);
});
});
}

function writeFile(data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(StoragePath, data, (err) => {
    if (err) {
      reject(err);
      return;
    }

    resolve();
});
});
}
function findTodoIndex(id, todos) {
  return todos.findIndex((todo) => todo.id === id);
}
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
// console.log(guid());

//Craft questions to present to users
const createQuestions = [
  {
    type : 'input',
    name : 'title',
    message : 'Enter title ...'
  },
  {
    type : 'input',
    name : 'description',
    message : 'Enter description ...'
  },
];
const updateQuestions = [
  {
    type : 'input',
    name : 'title',
    message : 'Enter new title ...'
  },
  {
    type : 'input',
    name : 'description',
    message : 'Enter new description ...'
  },
];

const commentQuestions = [
  {
    type : 'input',
    name : 'comment',
    message : 'Enter comment ...'
  },
];

let todos = [];
program
  .command('create')
  .alias('cr')
  .description('Create new TODO item')
  .action(() => {


  let answers;
prompt(createQuestions)
  .then((receivedAnswers) => {
  answers = receivedAnswers;
return readFile();
})
.then((data) => {
  todo = JSON.parse(data);
todos.push(answers);
}, (err) => {
  todos.push(answers);
})
.then(() => {
  writeFile(JSON.stringify(todos));

})
.catch((error) => {
  console.error(`error: ${error}`);
});
});


program
  .command('read <id>')
  .alias('rd')
  .description('Read TODO item')
  .action((id) => {
  return openFile()
    .then((fd) => {
    return readFile();
})
.then((data) => {
  return JSON.parse(data);
})
.then((obj) => {
  let result = obj.todos.find(el => el.id === id);
if (!result) {
  console.log(`TODO item not found`);
} else {
  console.log(result);
}
})
.catch((error) => {
  console.error(`error: ${error}`);
});
});

program
  .command('update <id>')
  .alias('upd')
  .description('Update TODO item')
  .action((id) => {
  let answers
  prompt(updateQuestions)
  .then(receivedAnswers => {
  answers = receivedAnswers;
return openFile();
})
.then((fd) => {
  return readFile();
})
.then((data) => {
  return JSON.parse(data);
})
.then((obj) => {
  let result;
obj.todos.forEach(el => {
  if (el.id === id) {
  result = el;
  el.title = answers.title;
  el.description = answers.description;
}
});
console.log(result);
return obj;
})
.then((updatedObj) => {
  return JSON.stringify(updatedObj);
})
.then((data) => {
  writeFile(data);
})
.catch((error) => {
  console.error(`error: ${error}`);
});
});

program
  .command('remove <id>')
  .alias('rm')
  .description('Remove TODO item by id')
  .action((id) => {
  removeTodoItem(id)
  .then(print)
  .catch((e) => {
  throw e;
});
});

program
  .command('list')
  .alias('ls')
  .description('List all TODOs')
  .action(() => {
  return openFile()
    .then((fd) => {
    return readFile();
})
.then((data) => {
  return JSON.parse(data);
})
.then((obj) => {
  obj.todos.map(el => console.log(el));
})
.catch((error) => {
  console.error(`error: ${error}`);
});
});


program
  .command('like <id>')
  .description('Like TODO item')
  .action((id) => {
  updateTodoItem(id, { isLiked: true })
  .then(print)
  .catch((e) => {
  throw e;
});
});

program
  .command('comment <id>')
  .description('Comment TODO item')
  .action((id) => {
  prompt(commentQuestions)
  .then(({ comment }) => updateTodoItem(id, { comment }))
.then(print)
  .catch((e) => {
  throw e;
});
});

program.parse(process.argv);
