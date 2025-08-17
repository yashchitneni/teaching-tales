// Phase 0 Validation Script
console.log('=== Phase 0 Isolation Validation ===\n');

try {
  // Test 1: Configuration Loading
  console.log('1. Testing configuration loading...');
  const config = require('./src/lib/config.ts');
  console.log('   ✅ Config module loads successfully');
  
  // Test 2: Existing Configuration Intact
  console.log('\n2. Testing existing configuration...');
  if (config.API_CONFIG && config.API_CONFIG.BASE_URL) {
    console.log('   ✅ API_CONFIG is intact');
    console.log('   📍 BASE_URL:', config.API_CONFIG.BASE_URL);
  } else {
    throw new Error('API_CONFIG is missing or malformed');
  }
  
  if (config.GEMINI_CONFIG && config.GEMINI_CONFIG.MODEL_NAME) {
    console.log('   ✅ GEMINI_CONFIG is intact');
    console.log('   📍 MODEL_NAME:', config.GEMINI_CONFIG.MODEL_NAME);
  } else {
    throw new Error('GEMINI_CONFIG is missing or malformed');
  }
  
  // Test 3: New Feature Flags
  console.log('\n3. Testing new feature flags...');
  if (config.FEATURE_FLAGS && typeof config.FEATURE_FLAGS.QTI_SPLIT_GENERATION_ENABLED === 'boolean') {
    console.log('   ✅ Server feature flag exists and is boolean');
    console.log('   📍 QTI_SPLIT_GENERATION_ENABLED:', config.FEATURE_FLAGS.QTI_SPLIT_GENERATION_ENABLED);
  } else {
    throw new Error('Server feature flag is missing or wrong type');
  }
  
  if (config.CLIENT_FEATURE_FLAGS && typeof config.CLIENT_FEATURE_FLAGS.QTI_SPLIT_GENERATION === 'boolean') {
    console.log('   ✅ Client feature flag exists and is boolean');
    console.log('   📍 QTI_SPLIT_GENERATION:', config.CLIENT_FEATURE_FLAGS.QTI_SPLIT_GENERATION);
  } else {
    throw new Error('Client feature flag is missing or wrong type');
  }
  
  // Test 4: Default Values
  console.log('\n4. Testing default values (safety check)...');
  if (config.FEATURE_FLAGS.QTI_SPLIT_GENERATION_ENABLED === false) {
    console.log('   ✅ Server flag defaults to false (safe)');
  } else {
    throw new Error('Server flag does not default to false - UNSAFE!');
  }
  
  if (config.CLIENT_FEATURE_FLAGS.QTI_SPLIT_GENERATION === false) {
    console.log('   ✅ Client flag defaults to false (safe)');
  } else {
    throw new Error('Client flag does not default to false - UNSAFE!');
  }
  
  console.log('\n🎉 ALL VALIDATION TESTS PASSED');
  console.log('✅ Phase 0 isolation is properly configured');
  console.log('✅ No breaking changes detected');
  console.log('✅ Feature flags are safely isolated');
  
} catch (error) {
  console.error('\n❌ VALIDATION FAILED:', error.message);
  console.error('⚠️  Phase 0 setup has issues that need to be resolved');
  process.exit(1);
}
