import * as assert from 'assert';
import { before, after } from 'mocha';
import * as sinon from 'sinon';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as path from 'path';

import Config from '../../config';
import { isItMyself, mySyncSettings } from '../../commands/mentions';

const uri = vscode.Uri.file(path.resolve(__dirname, '../../../demo/New Datacenter/Kick-off.md'));

suite('Demo workspace configuration', () => {

  let config = null;
	before(() => {
    config = Config(null);
	});

  test('should have owners e-mails', () => {
    assert.deepEqual(config.get('emails'), [ 
      'frenya@frenya.net' 
    ]);
  });

  test('should have initial mentions', () => {
    assert.deepEqual(config.get('mentions'), defaultWorkspaceMentions);
  });

  test('should identify myself', () => {
    assert(isItMyself(config, 'Frenya'));
    assert(!isItMyself(config, 'Frank'));
  });

  test('should get sync settings', () => {
    assert.deepEqual(mySyncSettings(config, 'Frenya'), {});
    assert.deepEqual(mySyncSettings(config, 'Frank'), null);
  });

});

suite('Demo folder configuration', () => {

  let config = null;
	before(() => {
    config = Config(uri);
	});

  // TODO: Add demo data to test merging and override
  test('should have initial mentions', () => {
    assert.deepEqual(config.get('mentions'), {
      ...defaultFolderMentions,
      ...defaultWorkspaceMentions
    });
  });

  test('should identify myself', () => {
    assert(isItMyself(config, 'Frenya'));
    assert(isItMyself(config, 'Frank'));
    assert(!isItMyself(config, 'Anne'));
  });

  test('should get sync settings', () => {
    assert.deepEqual(mySyncSettings(config, 'Frenya'), {});
    assert.deepEqual(mySyncSettings(config, 'Frank'), {});
    assert.deepEqual(mySyncSettings(config, 'Anne'), null);
  });

});


suite('Adding mentions', () => {

  let config = null;
  let folderConfig = null;
  let showInputBoxStub = null;

	before(() => {
    config = Config(null);
    folderConfig = Config(uri);

    // Stub the showInputBox method
    showInputBoxStub = sinon.stub(vscode.window, 'showInputBox').resolves('Sheldon Cooper');
  });
  
  after(() => {
    // Reset mentions back to default
    Config(null).update('mentions', defaultWorkspaceMentions);
    Config(uri).update('mentions', defaultFolderMentions);
  });

  test('should add mention to folder', async () => {
    await vscode.commands.executeCommand('coffeebreak.createMention', 'FMention', uri.path);
    assert.deepEqual(Config(uri).get('mentions'), {
      ...defaultFolderMentions,
      ...defaultWorkspaceMentions,
      'FMention': {}
    });
  });
  
  test('should add mention detail to folder', async () => {
    await vscode.commands.executeCommand('coffeebreak.addMentionDetail', 'FMention', 'fullname', uri.path);
    assert.deepEqual(Config(uri).get('mentions'), {
      ...defaultFolderMentions,
      ...defaultWorkspaceMentions,
      'FMention': {
        fullname: 'Sheldon Cooper'
      }
    });
  });
  
  test('should add mention to workspace', async () => {
    await vscode.commands.executeCommand('coffeebreak.createMention', 'WMention', '');
    assert.deepEqual(Config(null).get('mentions'), {
      ...defaultWorkspaceMentions,
      'WMention': {}
    });
  });
  
  test('should add mention detail to workspace', async () => {
    await vscode.commands.executeCommand('coffeebreak.addMentionDetail', 'WMention', 'fullname', '');
    assert.deepEqual(Config(null).get('mentions'), {
      ...defaultWorkspaceMentions,
      'WMention': {
        fullname: 'Sheldon Cooper'
      }
    });
  });
  
});


// Fixtures
const defaultWorkspaceMentions = {
  'Frenya': {
    'fullname': 'Frantisek Vymazal',
    'email': 'frenya@frenya.net'
  }
};

const defaultFolderMentions = {
  'John': {
    'fullname': 'John Adams',
    'deparment': 'Networking',
  },
  'Doug': {
    'fullname': 'Doug Brown',
    'deparment': 'IT Operations',
  },
  'Anne': {
    'fullname': 'Anne Crowley',
    'deparment': 'Finance',
  },
  'Sean': {
    'fullname': 'Sean Dermot',
    'deparment': 'UPS Technologies',
  },
  'Steve': {
    'fullname': 'Steve Evans',
    'deparment': 'AC Plus',
  },
  'Rich': {
    'fullname': 'Richard Francis',
    'deparment': 'Project Manager',
  },
  'Frank': {
    'fullname': 'Frantisek Vymazal',
    'email': 'frenya@frenya.net'
  }
};