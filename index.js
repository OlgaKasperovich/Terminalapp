#!/usr/bin/env node
const program = require('commander');
const { prompt } = require('inquirer');
const fs = require('fs');
const path = require('path');
const util = require('util');

program
  .version('0.0.1')
  .description('This is a TODO application');

const STORAGE_PATH = path.resolve('./node.json');
const ACCOUNT_ID = 1;
const { O_APPEND, O_RDONLY, O_CREAT } = fs.constants;

//turn async func into promise
const fsOpen = util.promisify(fs.open);
const fsReadFile = util.promisify(fs.readFile);
const fsWriteFile = util.promisify(fs.writeFile);


function getAllTodos() {
  return fsReadFile(STORAGE_PATH, { encoding: 'utf8', flag: O_RDONLY | O_CREAT })
    .then((data) => {
      let jsonText = data;
      if (!jsonText) jsonText = '{}';
      return JSON.parse(jsonText).todos|| [];
    })
    // .then((storage) => {
    //   return storage.todos || [];
    // });
}

function saveAllTodos(todos) {
  return fsOpen(STORAGE_PATH, O_APPEND | O_CREAT)
    .then(() => {
      fsWriteFile(STORAGE_PATH, JSON.stringify({ todos }));
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
  return s4() + s4()  + '-' + s4() + s4() + s4();
}

function print(...args) {
  console.info(...args);
}

//creating task for Todos list
function createTodo(data) {
  const now = new Date();
  return {
    id: guid(),
    ...data,
    comment: null,
    createdByUserId: ACCOUNT_ID,
    isLiked: false,
    lastUpdateByUserId: ACCOUNT_ID,

  };
}

function updateTodo(change, todo) {
  return {
    ...todo,
    ...change,
    lastUpdateByUserId: ACCOUNT_ID,
    createdByUserId: todo.createdByUserId,
  };
}


function createTodoItem(data) {
  let todoId;

  return getAllTodos()
    .then((todos) => {
      const todo = createTodo(data);
      todoId = todo.id;
      const result = [...todos, todo];
      return saveAllTodos(result);
    })
    .then(() => todoId);
}

function readTodoItem(id) {
  return getAllTodos()
    .then((todos) => {
      const index = findTodoIndex(id, todos);
      const target = todos[index];
      if (target != undefined) {
        return target;
      }
      else {
        return 'TODO item not found';
      }
    })
}


function updateTodoItem(id, change) {
  return getAllTodos()
    .then((todos) => {
      const index = findTodoIndex(id, todos);
      const target = todos[index];
      const result = [...todos];

      result.splice(index, 1, updateTodo(change, target));

      return saveAllTodos(result);
    })
    .then(() => id);
}

//
// function removeTodoItem(id) {
//   return getAllTodos()
//     .then((todos) => {
//       const index = findTodoIndex(id, todos);
//       const result = [...todos];
//       const target = todos[index];
//       if (target != undefined) {
//         const removedItem = ((result.splice(index, 1))[0]);
//         return saveAllTodos(result)
//           .then (() => {
//             return getAllRemovedTodos()
//               .then((removedTodos) =>{
//                 removedResult = [...removedTodos, removedItem]
//                 return saveAllRemovedTodos(removedResult)
//               })
//               .then(() => 'Removed items: ' + removedResult.length)
//           });
//       }else{
//         return 'TODO item not found';
//       }
//     })
// }




function removeTodoItem(id) {
  return getAllTodos()
    .then((todos) => {
      const index = findTodoIndex(id, todos);
      if (index===-1)return 'Todo is not found';
      const result = [...todos];

      const removedItems = result.splice(index, 1);

      return saveAllTodos(result).then(() => removedItems.length);
    });
}

// function likeTodoItem(id, change) {
//   return getAllTodos()
//     .then((todos) => {
//       const index = findTodoIndex(id, todos);
//       const result = [...todos];
//       const target = todos[index];
//       if (target != undefined) {
//         result.splice(index, 1, updateTodo(change, target));
//         console.log("Like result: " + result[index].isLiked);
//         return  saveAllTodos(result);
//       }else {
//         return 'this item not exist';
//       }
//     })
// }


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


program
  .command('create')
  .description('Create new TODO item')
  .action(() => {
    prompt(createQuestions)
      .then(({ title, description }) => createTodoItem({ title, description }))
      .then(print)
      .catch((error) => {
        throw error;
      });
  });
program
  .command('read <id>')
  .alias('r')
  .description('Print TODO item')
  .action((id) => {
    readTodoItem(id)
      .then(print)
      .catch((e) => {
        throw e;
      })
  });

// program
//   .command('read <id>')
//   .alias('rd')
//   .description('Read TODO item')
//   .action((id) => {
//     return fsOpen()
//       .then((fd) => {
//         return fsReadFile();
//       })
//       .then((data) => {
//         return JSON.parse(data);
//       })
//       .then((obj) => {
//         let result = obj.todos.find(el => el.id === id);
//         if (!result) {
//           console.log(`TODO item not found`);
//         } else {
//           console.log(result);
//         }
//       })
//         .catch((error) => {
//         console.error(`error: ${error}`);
//       });
//   });
//

program
  .command('update <id>')
  .description('Update TODO item')
  .action((id) => {
    prompt(updateQuestions)
      .then(({ title, description }) => updateTodoItem(id, { title, description }))
      .then(print)
      .catch((e) => {
        throw e;
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
    getAllTodos().then(print)
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
  .command('unlike <id>')
  .alias('ul')
  .description('Like TODO item')
  .action((id) => {
    likeTodoItem(id, {isLiked:false})
    //.then(print)
      .catch((e) => {
        throw e;
      })
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