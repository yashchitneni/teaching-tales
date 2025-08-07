#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Helper script for quality control between phases

function generateReviewHTML() {
  const resultsFile = path.join(__dirname, 'phase1-generated-images.json');
  
  if (!fs.existsSync(resultsFile)) {
    console.error('❌ phase1-generated-images.json not found. Run phase 1 first.');
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  const successful = results.filter(r => r.status === 'generated');

  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Image Quality Review - Phase 1</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .category { margin-bottom: 40px; }
        .image-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .image-item { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .image-item img { max-width: 100%; height: 200px; object-fit: cover; }
        .approved { border-color: #4CAF50; background-color: #f1f8e9; }
        .rejected { border-color: #f44336; background-color: #ffebee; }
        .checkbox { margin: 10px 0; }
        .prompt { font-size: 12px; color: #666; margin-top: 10px; }
        .controls { margin: 20px 0; }
        button { padding: 10px 20px; margin: 5px; }
        .save-button { background-color: #4CAF50; color: white; border: none; border-radius: 4px; }
    </style>
</head>
<body>
    <h1>Image Quality Review - Phase 1</h1>
    <p>Review ${successful.length} generated images and mark them for approval or regeneration.</p>
    
    <div class="controls">
        <button class="save-button" onclick="saveApprovals()">Save Approvals to JSON</button>
        <button onclick="selectAll()">Approve All</button>
        <button onclick="selectNone()">Clear All</button>
    </div>

    ${Object.entries(groupByCategory(successful)).map(([category, items]) => `
        <div class="category">
            <h2>${category.toUpperCase()} (${items.length} images)</h2>
            <div class="image-grid">
                ${items.map((item, index) => `
                    <div class="image-item" id="item-${item.id || index}">
                        <img src="${item.replicateUrl}" alt="${item.name}" onerror="this.style.display='none'">
                        <h4>${item.name}</h4>
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" name="approved" data-id="${item.id || index}" onchange="updateItemStatus(this)">
                                ✅ Approve
                            </label>
                        </div>
                        <div class="checkbox">
                            <label>
                                <input type="checkbox" name="regenerate" data-id="${item.id || index}" onchange="updateItemStatus(this)">
                                🔄 Regenerate
                            </label>
                        </div>
                        <div class="prompt">
                            <strong>Prompt:</strong> ${item.prompt}
                        </div>
                        <div>
                            <label>Custom prompt (optional):</label><br>
                            <textarea data-id="${item.id || index}" name="customPrompt" rows="2" style="width: 100%; margin-top: 5px;"></textarea>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('')}

    <script>
        const originalData = ${JSON.stringify(successful, null, 2)};
        
        function updateItemStatus(checkbox) {
            const itemDiv = checkbox.closest('.image-item');
            const isApproved = itemDiv.querySelector('input[name="approved"]').checked;
            const isRegenerate = itemDiv.querySelector('input[name="regenerate"]').checked;
            
            // Prevent both being checked
            if (checkbox.name === 'approved' && checkbox.checked) {
                itemDiv.querySelector('input[name="regenerate"]').checked = false;
            } else if (checkbox.name === 'regenerate' && checkbox.checked) {
                itemDiv.querySelector('input[name="approved"]').checked = false;
            }
            
            // Update visual status
            itemDiv.classList.remove('approved', 'rejected');
            if (isApproved) {
                itemDiv.classList.add('approved');
            } else if (isRegenerate) {
                itemDiv.classList.add('rejected');
            }
        }
        
        function selectAll() {
            document.querySelectorAll('input[name="approved"]').forEach(cb => {
                cb.checked = true;
                updateItemStatus(cb);
            });
        }
        
        function selectNone() {
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
            document.querySelectorAll('.image-item').forEach(item => {
                item.classList.remove('approved', 'rejected');
            });
        }
        
        function saveApprovals() {
            const updatedData = originalData.map((item, index) => {
                const itemDiv = document.getElementById('item-' + (item.id || index));
                const approved = itemDiv.querySelector('input[name="approved"]').checked;
                const regenerate = itemDiv.querySelector('input[name="regenerate"]').checked;
                const customPrompt = itemDiv.querySelector('textarea[name="customPrompt"]').value;
                
                return {
                    ...item,
                    approved: approved,
                    regenerate: regenerate,
                    customPrompt: customPrompt || undefined
                };
            });
            
            // Create downloadable JSON file
            const blob = new Blob([JSON.stringify(updatedData, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'phase1-generated-images.json';
            a.click();
            URL.revokeObjectURL(url);
            
            alert('Approvals saved! Replace the phase1-generated-images.json file with the downloaded version.');
        }
        
        function groupByCategory(items) {
            return items.reduce((groups, item) => {
                const category = item.category || 'other';
                if (!groups[category]) groups[category] = [];
                groups[category].push(item);
                return groups;
            }, {});
        }
    </script>
</body>
</html>
  `;

  const htmlFile = path.join(__dirname, 'image-review.html');
  fs.writeFileSync(htmlFile, html);
  
  console.log(`✅ Quality control HTML generated: ${htmlFile}`);
  console.log(`🌐 Open in browser to review and approve images`);
  console.log(`📝 Click "Save Approvals" to download updated JSON file`);
}

function groupByCategory(items) {
  return items.reduce((groups, item) => {
    const category = item.category || 'other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {});
}

function showPhase1Summary() {
  const resultsFile = path.join(__dirname, 'phase1-generated-images.json');
  
  if (!fs.existsSync(resultsFile)) {
    console.log('❌ No phase1-generated-images.json found');
    return;
  }

  const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  const successful = results.filter(r => r.status === 'generated');
  const failed = results.filter(r => r.status === 'failed');
  const approved = results.filter(r => r.approved === true);
  const toRegenerate = results.filter(r => r.regenerate === true);

  console.log(`📊 PHASE 1 SUMMARY:`);
  console.log(`✅ Generated: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  console.log(`👍 Approved: ${approved.length}`);
  console.log(`🔄 To regenerate: ${toRegenerate.length}`);
  console.log(`⏳ Pending review: ${successful.length - approved.length - toRegenerate.length}`);

  const byCategory = groupByCategory(successful);
  console.log(`\n📂 BY CATEGORY:`);
  Object.entries(byCategory).forEach(([category, items]) => {
    console.log(`  ${category}: ${items.length} images`);
  });
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--review-html')) {
    generateReviewHTML();
  } else if (args.includes('--summary')) {
    showPhase1Summary();
  } else {
    console.log(`🎯 Quality Control Helper

USAGE:
  node quality-control-helper.js --review-html    # Generate HTML review page
  node quality-control-helper.js --summary        # Show phase 1 summary

WORKFLOW:
  1. After phase 1 completes, run --review-html
  2. Open image-review.html in your browser
  3. Review each image and mark approve/regenerate
  4. Click "Save Approvals" to download updated JSON
  5. Replace phase1-generated-images.json with downloaded file
  6. Run phase 2
`);
  }
}

if (require.main === module) {
  main();
}
