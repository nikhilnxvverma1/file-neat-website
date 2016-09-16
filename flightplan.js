var plan = require('flightplan');

var appName = 'file-neat-website';
var username = 'deploy';
// var startFile = 'bin/www';

// var tmpDir = appName+'-' + new Date().getTime();
var tmpDir = appName+'-codebase';

// configuration
plan.target('staging', [
	{
		host: '138.68.53.234',
		username: username,
		privateKey:'/Users/NikhilVerma/.ssh/id_rsa',
		agent: process.env.SSH_AUTH_SOCK
	}
]);

plan.target('production', [
	{
		host: '138.68.53.234',
		username: username,
		privateKey:'/Users/NikhilVerma/.ssh/id_rsa',
		agent: process.env.SSH_AUTH_SOCK
	}
//add in another server if you have more than one
// {
//   host: '104.131.93.216',
//   username: username,
//   agent: process.env.SSH_AUTH_SOCK
// }
]);

// run commands on localhost
plan.local(function(local) {
	local.log('Local start :'+new Date().toString());
	local.log('Copy files to remote hosts');
	// uncomment these if you need to run a build on your machine first
	// local.log('Run build');
	// local.exec('gulp build');
	var filesToCopy = local.exec('git ls-files', {silent: true});
	//var filesToCopy = local.exec('find . -type f | sed \'s/^..//\'', {silent: false});
	//local.log("Files to copy length:"+filesToCopy.length);
	
	// rsync files to all the destination's hosts
	local.transfer(filesToCopy, '/tmp/' + tmpDir);
	local.log('Local end: '+new Date().toString());
});

// run commands on remote hosts (destinations)
plan.remote(function(remote) {
	remote.log('Remote start :'+new Date().toString());
	remote.log('Deleting last codebase from users home directory');
	remote.rm('-rf ~/' + tmpDir);
	remote.log('Move folder to root');
	remote.sudo('cp -R /tmp/' + tmpDir + ' ~', {user: username});
	remote.rm('-rf /tmp/' + tmpDir);

	//we are manually copying depenedencies from a known dev copy on server
	//remote.log('Install dependencies');
	//remote.sudo('npm --production --prefix ~/' + tmpDir + ' install ~/' + tmpDir, {user: username});

	remote.log("Copying dependencies from working copy");
	//remote.rm('-R ~/'+tmpDir+'/node_modules');
	remote.cp('-R ~/working-dev-copy-fine/node_modules/ ~/'+tmpDir+'/');
	
	remote.log('Reload application');
	//remote.sudo('ln -snf ~/' + tmpDir + ' ~/'+appName, {user: username});//symlink
	remote.exec('pm2 stop '+appName, {failsafe: true});
	
	remote.with('cd ~/'+tmpDir, function() {
		remote.exec('pm2 start keystone.js'+' --name='+appName);
	});

	//remote.exec('cd ~/'+tmpDir);
	//remote.exec('pm2 start keystone.js'+' --name='+appName);
	
	remote.log('Remote end :'+new Date().toString());
	// remote.exec('cd ~/'+tmpDir);
	// remote.exec('pm2 start keystone.js'+' --name='+appName);
	// remote.exec('cd ~');//go back to home directory
	
});
