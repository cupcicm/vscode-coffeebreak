
/* IMPORT */

import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import ItemTodo from '../views/items/todo';
import Utils from '../utils';
import ViewEmbedded from '../views/embedded';

import { toggleTodo, toggleDone } from './toggle';
import { todoistSync, updateToken } from './todoist';
import { syncFile } from './sync';
import { createMention } from './mentions';

/* VIEW */

function viewRevealTodo ( todo: ItemTodo ) {

  if ( todo.obj.todo ) {

    const startIndex = todo.obj.rawLine.indexOf ( todo.obj.todo ),
          endIndex = startIndex + todo.obj.todo.length;

    Utils.file.open ( todo.obj.filePath, true, todo.obj.lineNr, startIndex, endIndex );

  } else {

    Utils.file.open ( todo.obj.filePath, true, todo.obj.lineNr );

  }

}

function openTaskURL ( todo: ItemTodo ) {
  // console.log(todo);
  vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(todo.obj.externalURL));
}



/* VIEW EMBEDDED */

function viewEmbeddedCollapse () {
  ViewEmbedded.expanded = false;
  vscode.commands.executeCommand ( 'setContext', 'todo-embedded-expanded', false );
  ViewEmbedded.refresh ( true );
}

function viewEmbeddedExpand () {
  ViewEmbedded.expanded = true;
  vscode.commands.executeCommand ( 'setContext', 'todo-embedded-expanded', true );
  ViewEmbedded.refresh ( true );
}

async function viewEmbeddedFilter () {

  const filter = await vscode.window.showInputBox ({ placeHolder: 'Filter string...' });

  if ( !filter || ViewEmbedded.filter === filter ) return;

  ViewEmbedded.filter = filter;
  ViewEmbedded.filterRe = filter ? new RegExp ( _.escapeRegExp ( filter ), 'i' ) : false;
  vscode.commands.executeCommand ( 'setContext', 'todo-embedded-filtered', true );
  ViewEmbedded.refresh ();

}

function viewEmbeddedClearFilter () {
  ViewEmbedded.filter = false;
  ViewEmbedded.filterRe = false;
  vscode.commands.executeCommand ( 'setContext', 'todo-embedded-filtered', false );
  ViewEmbedded.refresh ();
}

async function viewEmbeddedFilterByOwner (type) {

  if (type == null) {
    // FIXME: Get value from config
    type = await vscode.window.showInputBox ({ value: '@Franta' });
    if (type == null) return;
    else type = '<unassigned>';
  }

  // Avoid unnecessary refreshes
  if ( ViewEmbedded.filterOwner === type ) return;

  ViewEmbedded.filterOwner =type;
  vscode.commands.executeCommand ( 'setContext', 'todo-embedded-filtered-owner', !!type );
  if (type) {
    ViewEmbedded.expanded = true;
    vscode.commands.executeCommand ( 'setContext', 'todo-embedded-expanded', true );
  }
  ViewEmbedded.refresh ( true );

}

async function viewEmbeddedFilterMyTasks () {
  viewEmbeddedFilterByOwner('@Franta');
}

async function viewEmbeddedFilterUnassignedTasks () {
  viewEmbeddedFilterByOwner('<unassigned>');
}

async function viewEmbeddedFilterAllTasks () {
  viewEmbeddedFilterByOwner(null);
}

async function viewEmbeddedFilterByDate () {

  const filter = await vscode.window.showInputBox ({ value: new Date().toISOString().substr(0, 10) });
  if (filter != null) viewEmbeddedDueTasks(filter || '2999-12-31');

}

async function viewEmbeddedDueTasks (date) {

  // Avoid unnecessary refreshes
  if ( ViewEmbedded.filterDueDate === date ) return;

  ViewEmbedded.filterDueDate = date;
  vscode.commands.executeCommand ( 'setContext', 'todo-embedded-filtered-due', !!date );
  if (date) {
    ViewEmbedded.expanded = true;
    vscode.commands.executeCommand ( 'setContext', 'todo-embedded-expanded', true );
  }
  ViewEmbedded.refresh ( true );

}

async function viewEmbeddedDueToday () {
  viewEmbeddedDueTasks(new Date().toISOString().substr(0, 10));
}

async function viewEmbeddedDueAnytime () {
  viewEmbeddedDueTasks(null);
}


async function viewEmbeddedShowLinkedTasks () {

  ViewEmbedded.hideLinked = false;
  vscode.commands.executeCommand ( 'setContext', 'todo-embedded-hide-linked', false );
  ViewEmbedded.refresh ( true );

}

async function viewEmbeddedHideLinkedTasks () {

  ViewEmbedded.hideLinked = true;
  vscode.commands.executeCommand ( 'setContext', 'todo-embedded-hide-linked', true );
  ViewEmbedded.refresh ( true );

}

/* FILE CREATION */

async function newFile () {

  const title = await vscode.window.showInputBox ({ placeHolder: 'Note title [, Folder]' });

  // Sanity check (null means Esc was pressed)
  // tslint:disable-next-line:triple-equals
  if (title == null) return;

  const comps = title.split(',');

  let folder = Utils.folder.getRootPath();
  let name = comps[0].trim() || 'Untitled';
  let suffix: any = '';

  if (comps.length > 1) {
    const paths = Utils.folder.getAllRootPaths();
    folder = paths.find((p: string) => path.basename(p).toLowerCase().startsWith(comps[1].trim().toLowerCase())) || folder;
  }

  // Get current date
  let date = new Date().toISOString().substr(0, 10);

  // SNIPPET
  // Find first non-colliding name
  while (fs.existsSync(`${folder}/${date} ${name}${suffix}.md`)) {
    suffix = (suffix || 0) - 1;
  }

  var uri: vscode.Uri = vscode.Uri.parse(`untitled:${folder}/${date} ${name}${suffix}.md`);
  vscode.workspace.openTextDocument(uri).then((doc: vscode.TextDocument) => {
      vscode.window.showTextDocument(doc, 1, false).then(e => {
          if (name !== 'Untitled') {
            e.edit(edit => { edit.insert(new vscode.Position(0, 0), `# ${name}\n\n`); });
          }
      });
  }, (error: any) => {
      console.error(error);
      debugger;
  });
}

/* EXPORT */

export {
  viewRevealTodo, viewEmbeddedCollapse, viewEmbeddedExpand, 
  viewEmbeddedFilter, viewEmbeddedClearFilter, 
  openTaskURL, newFile, 
  toggleTodo, toggleDone,
  viewEmbeddedFilterMyTasks, viewEmbeddedFilterUnassignedTasks, viewEmbeddedFilterAllTasks, viewEmbeddedFilterByOwner,
  viewEmbeddedDueToday, viewEmbeddedDueAnytime, viewEmbeddedFilterByDate,
  viewEmbeddedShowLinkedTasks, viewEmbeddedHideLinkedTasks,
  syncFile, todoistSync, updateToken,
  createMention
};
