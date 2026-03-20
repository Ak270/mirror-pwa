// Test VAPID keys are valid
const webpush = require('web-push');

const publicKey = 'BA7ywX9_rrQKZlVXkjIzOpzsWAfDOItBgOuhvBv4oznUtHEu6uvxPbIEWZtCDJvdhtOLck4mh_ymi1-TG3H07Ks';
const privateKey = '_t_U2egNPgRbQbZ497tXKSAupx1-C1dER2t27MpMHBQ';
const subject = 'mailto:amarkelotra@gmail.com';

try {
  webpush.setVapidDetails(subject, publicKey, privateKey);
  console.log('✅ VAPID keys are VALID!');
  console.log('✅ Public key length:', publicKey.length, 'chars');
  console.log('✅ Private key length:', privateKey.length, 'chars');
  console.log('✅ Subject:', subject);
  console.log('\n🎉 Your environment is configured correctly!');
  console.log('\nNext steps:');
  console.log('1. Go to http://localhost:3001/profile');
  console.log('2. Click "Enable notifications" button');
  console.log('3. Allow browser permission');
  console.log('4. Then click "Test Notifications"');
} catch (err) {
  console.error('❌ VAPID keys are INVALID:', err.message);
  process.exit(1);
}
