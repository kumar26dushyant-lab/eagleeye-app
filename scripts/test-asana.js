#!/usr/bin/env node
/**
 * Asana Integration Test Script
 * 
 * Usage:
 *   node scripts/test-asana.js YOUR_ASANA_TOKEN
 *   
 * Or set ASANA_ACCESS_TOKEN env var:
 *   $env:ASANA_ACCESS_TOKEN = "1/your-token-here"
 *   node scripts/test-asana.js
 */

const ASANA_API = 'https://app.asana.com/api/1.0';

async function request(token, endpoint) {
  const response = await fetch(`${ASANA_API}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.errors?.[0]?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

async function testAsana(token) {
  console.log('\n🦅 EagleEye Asana Integration Test\n');
  console.log('='.repeat(50));

  try {
    // Step 1: Test authentication
    console.log('\n📡 Step 1: Testing authentication...');
    const user = await request(token, '/users/me');
    console.log('   ✅ Token valid!');
    console.log(`   👤 User: ${user.name} (${user.email})`);
    console.log(`   🆔 GID: ${user.gid}`);

    // Step 2: Get workspaces
    console.log('\n🏢 Step 2: Getting workspaces...');
    const workspaces = await request(token, '/workspaces');
    console.log(`   ✅ Found ${workspaces.length} workspace(s)`);
    
    for (const ws of workspaces) {
      console.log(`   📁 ${ws.name} (${ws.gid})`);
    }

    if (workspaces.length === 0) {
      console.log('   ⚠️  No workspaces found. Create one in Asana first.');
      return false;
    }

    const workspace = workspaces[0];

    // Step 3: Get user's tasks
    console.log('\n📋 Step 3: Fetching your tasks...');
    const params = new URLSearchParams({
      workspace: workspace.gid,
      assignee: user.gid,
      completed_since: 'now', // Only incomplete tasks
      opt_fields: 'gid,name,due_on,due_at,completed,projects.name,permalink_url,modified_at',
    });

    const myTasks = await request(token, `/tasks?${params}`);
    console.log(`   ✅ Found ${myTasks.length} task(s) assigned to you`);

    if (myTasks.length > 0) {
      console.log('\n   Your Tasks:');
      for (const task of myTasks.slice(0, 5)) {
        const due = task.due_on || task.due_at || 'No due date';
        const project = task.projects?.[0]?.name || 'No project';
        const emoji = task.completed ? '✅' : (task.due_on && new Date(task.due_on) < new Date() ? '🔴' : '📌');
        console.log(`   ${emoji} ${task.name}`);
        console.log(`      Due: ${due} | Project: ${project}`);
      }
      if (myTasks.length > 5) {
        console.log(`   ... and ${myTasks.length - 5} more tasks`);
      }
    }

    // Step 4: Get recent tasks (using assignee filter as required by Asana API)
    console.log('\n🔄 Step 4: Fetching recent activity...');
    const recentParams = new URLSearchParams({
      workspace: workspace.gid,
      assignee: user.gid,
      'modified_at.after': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Last 7 days
      opt_fields: 'gid,name,assignee.name,modified_at,projects.name',
    });

    const recentTasks = await request(token, `/tasks?${recentParams}`);
    console.log(`   ✅ Found ${recentTasks.length} task(s) modified in last 7 days`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 ASANA CONNECTION SUCCESSFUL!\n');
    console.log('Summary:');
    console.log(`   • User: ${user.name}`);
    console.log(`   • Workspace: ${workspace.name}`);
    console.log(`   • Your Tasks: ${myTasks.length}`);
    console.log(`   • Recent Activity: ${recentTasks.length} tasks`);
    
    console.log('\n📝 Next Step: Add this to your .env.local:');
    console.log(`   ASANA_ACCESS_TOKEN=${token.slice(0, 10)}...`);
    
    return true;

  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    
    if (error.message.includes('401') || error.message.includes('Not Authorized')) {
      console.log('\n💡 This usually means:');
      console.log('   1. Token is invalid or expired');
      console.log('   2. Token was revoked');
      console.log('   3. Token format is wrong (should start with "1/")');
      console.log('\n   Get a new token at: https://app.asana.com/0/developer-console');
    }
    
    return false;
  }
}

// Run the test
const token = process.argv[2] || process.env.ASANA_ACCESS_TOKEN;

if (!token) {
  console.log(`
🦅 Asana Test Script

Usage:
  node scripts/test-asana.js YOUR_TOKEN

  Or set environment variable:
  $env:ASANA_ACCESS_TOKEN = "1/your-token-here"
  node scripts/test-asana.js

Get your Personal Access Token:
  1. Go to: https://app.asana.com/0/developer-console
  2. Click "Create new token" 
  3. Copy the token (starts with "1/")
`);
  process.exit(1);
}

testAsana(token).then(success => {
  process.exit(success ? 0 : 1);
});
