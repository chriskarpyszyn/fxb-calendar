#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class StreamScheduleUpdater {
  constructor() {
    this.jsonPath = path.join(__dirname, 'public', 'streamSchedule.json');
    this.data = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🎮 FXB Calendar JSON Update Tool');
    console.log('================================\n');
    
    try {
      await this.loadData();
      await this.showMainMenu();
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }

  async loadData() {
    try {
      const jsonContent = fs.readFileSync(this.jsonPath, 'utf8');
      this.data = JSON.parse(jsonContent);
      console.log('✅ Successfully loaded streamSchedule.json\n');
    } catch (error) {
      console.error('❌ Failed to load JSON file:', error.message);
      throw error;
    }
  }

  async saveData() {
    try {
      const jsonContent = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(this.jsonPath, jsonContent, 'utf8');
      console.log('✅ Changes saved successfully!\n');
    } catch (error) {
      console.error('❌ Failed to save JSON file:', error.message);
      throw error;
    }
  }

  async showMainMenu() {
    console.log('📋 Main Menu:');
    console.log('1. View current schedule');
    console.log('2. Add new stream');
    console.log('3. Edit existing stream');
    console.log('4. Delete stream');
    console.log('5. Update month/year');
    console.log('6. Manage categories');
    console.log('7. Save and exit');
    console.log('8. Exit without saving\n');

    const choice = await this.askQuestion('Choose an option (1-8): ');
    
    switch (choice) {
      case '1':
        await this.viewSchedule();
        break;
      case '2':
        await this.addStream();
        break;
      case '3':
        await this.editStream();
        break;
      case '4':
        await this.deleteStream();
        break;
      case '5':
        await this.updateMonthYear();
        break;
      case '6':
        await this.manageCategories();
        break;
      case '7':
        await this.saveData();
        console.log('👋 Goodbye!');
        this.rl.close();
        return;
      case '8':
        console.log('👋 Exiting without saving...');
        this.rl.close();
        return;
      default:
        console.log('❌ Invalid option. Please try again.\n');
        await this.showMainMenu();
    }
  }

  async viewSchedule() {
    console.log('\n📅 Current Schedule:');
    console.log(`Month: ${this.data.month}, Year: ${this.data.year}\n`);
    
    if (Object.keys(this.data.streams).length === 0) {
      console.log('No streams scheduled.\n');
    } else {
      Object.entries(this.data.streams).forEach(([id, stream]) => {
        console.log(`Stream ${id}:`);
        console.log(`  Category: ${stream.category}`);
        console.log(`  Subject: ${stream.subject}`);
        console.log(`  Time: ${stream.time}\n`);
      });
    }
    
    await this.askQuestion('Press Enter to continue...');
    await this.showMainMenu();
  }

  async addStream() {
    console.log('\n➕ Add New Stream:');
    
    const id = await this.askQuestion('Enter stream ID: ');
    
    if (!id || id.trim() === '') {
      console.log('❌ Stream ID cannot be empty!\n');
      await this.addStream();
      return;
    }
    
    if (this.data.streams[id]) {
      console.log('❌ Stream ID already exists!\n');
      await this.addStream();
      return;
    }

    const category = await this.askQuestion('Enter category: ');
    if (!category || category.trim() === '') {
      console.log('❌ Category cannot be empty!\n');
      await this.addStream();
      return;
    }

    const subject = await this.askQuestion('Enter subject: ');
    if (!subject || subject.trim() === '') {
      console.log('❌ Subject cannot be empty!\n');
      await this.addStream();
      return;
    }

    const time = await this.askQuestion('Enter time (e.g., "7:00pm - 9:00pm EST"): ');
    if (!time || time.trim() === '') {
      console.log('❌ Time cannot be empty!\n');
      await this.addStream();
      return;
    }

    this.data.streams[id] = {
      category: category.trim(),
      subject: subject.trim(),
      time: time.trim()
    };

    console.log('✅ Stream added successfully!\n');
    await this.showMainMenu();
  }

  async editStream() {
    console.log('\n✏️ Edit Stream:');
    
    const id = await this.askQuestion('Enter stream ID to edit: ');
    
    if (!this.data.streams[id]) {
      console.log('❌ Stream ID not found!\n');
      await this.editStream();
      return;
    }

    const current = this.data.streams[id];
    console.log(`\nCurrent stream ${id}:`);
    console.log(`  Category: ${current.category}`);
    console.log(`  Subject: ${current.subject}`);
    console.log(`  Time: ${current.time}\n`);

    const category = await this.askQuestion(`Enter new category (current: ${current.category}): `) || current.category;
    const subject = await this.askQuestion(`Enter new subject (current: ${current.subject}): `) || current.subject;
    const time = await this.askQuestion(`Enter new time (current: ${current.time}): `) || current.time;

    this.data.streams[id] = { category, subject, time };

    console.log('✅ Stream updated successfully!\n');
    await this.showMainMenu();
  }

  async deleteStream() {
    console.log('\n🗑️ Delete Stream:');
    
    const id = await this.askQuestion('Enter stream ID to delete: ');
    
    if (!this.data.streams[id]) {
      console.log('❌ Stream ID not found!\n');
      await this.deleteStream();
      return;
    }

    const stream = this.data.streams[id];
    console.log(`\nStream to delete:`);
    console.log(`  Category: ${stream.category}`);
    console.log(`  Subject: ${stream.subject}`);
    console.log(`  Time: ${stream.time}\n`);

    const confirm = await this.askQuestion('Are you sure you want to delete this stream? (y/N): ');
    
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      delete this.data.streams[id];
      console.log('✅ Stream deleted successfully!\n');
    } else {
      console.log('❌ Deletion cancelled.\n');
    }
    
    await this.showMainMenu();
  }

  async updateMonthYear() {
    console.log('\n📅 Update Month/Year:');
    console.log(`Current: Month ${this.data.month}, Year ${this.data.year}\n`);
    
    const month = await this.askQuestion('Enter new month (1-12): ');
    const year = await this.askQuestion('Enter new year: ');

    if (month && !isNaN(month) && month >= 1 && month <= 12) {
      this.data.month = parseInt(month);
    } else if (month && (isNaN(month) || month < 1 || month > 12)) {
      console.log('❌ Invalid month. Must be between 1 and 12.\n');
      await this.updateMonthYear();
      return;
    }
    
    if (year && !isNaN(year) && year > 0) {
      this.data.year = parseInt(year);
    } else if (year && (isNaN(year) || year <= 0)) {
      console.log('❌ Invalid year. Must be a positive number.\n');
      await this.updateMonthYear();
      return;
    }

    console.log(`✅ Updated to Month ${this.data.month}, Year ${this.data.year}\n`);
    await this.showMainMenu();
  }

  async manageCategories() {
    console.log('\n🎨 Manage Categories:');
    console.log('1. View categories');
    console.log('2. Add new category');
    console.log('3. Edit category colors');
    console.log('4. Delete category');
    console.log('5. Back to main menu\n');

    const choice = await this.askQuestion('Choose an option (1-5): ');
    
    switch (choice) {
      case '1':
        await this.viewCategories();
        break;
      case '2':
        await this.addCategory();
        break;
      case '3':
        await this.editCategoryColors();
        break;
      case '4':
        await this.deleteCategory();
        break;
      case '5':
        await this.showMainMenu();
        break;
      default:
        console.log('❌ Invalid option. Please try again.\n');
        await this.manageCategories();
    }
  }

  async viewCategories() {
    console.log('\n🎨 Current Categories:');
    Object.entries(this.data.categories).forEach(([name, colors]) => {
      console.log(`\n${name}:`);
      console.log(`  Background: ${colors.bg}`);
      console.log(`  Border: ${colors.border}`);
      console.log(`  Text: ${colors.text}`);
      console.log(`  Dot: ${colors.dot}`);
    });
    console.log('');
    await this.manageCategories();
  }

  async addCategory() {
    console.log('\n➕ Add New Category:');
    
    const name = await this.askQuestion('Enter category name: ');
    
    if (!name || name.trim() === '') {
      console.log('❌ Category name cannot be empty!\n');
      await this.addCategory();
      return;
    }
    
    if (this.data.categories[name]) {
      console.log('❌ Category already exists!\n');
      await this.addCategory();
      return;
    }

    const validColors = ['purple', 'pink', 'blue', 'green', 'orange', 'red', 'yellow', 'indigo', 'gray'];
    console.log('\nAvailable color options:');
    console.log(validColors.join(', '));
    
    const color = (await this.askQuestion('Enter base color: ')).toLowerCase().trim();
    
    if (!validColors.includes(color)) {
      console.log(`❌ Invalid color. Please choose from: ${validColors.join(', ')}\n`);
      await this.addCategory();
      return;
    }
    
    this.data.categories[name] = {
      bg: `bg-${color}-100`,
      border: `border-${color}-400`,
      text: `text-${color}-800`,
      dot: `bg-${color}-500`
    };

    console.log('✅ Category added successfully!\n');
    await this.manageCategories();
  }

  async editCategoryColors() {
    console.log('\n✏️ Edit Category Colors:');
    
    const name = await this.askQuestion('Enter category name to edit: ');
    
    if (!this.data.categories[name]) {
      console.log('❌ Category not found!\n');
      await this.editCategoryColors();
      return;
    }

    const validColors = ['purple', 'pink', 'blue', 'green', 'orange', 'red', 'yellow', 'indigo', 'gray'];
    console.log('\nAvailable color options:');
    console.log(validColors.join(', '));
    
    const color = (await this.askQuestion('Enter new base color: ')).toLowerCase().trim();
    
    if (!validColors.includes(color)) {
      console.log(`❌ Invalid color. Please choose from: ${validColors.join(', ')}\n`);
      await this.editCategoryColors();
      return;
    }
    
    this.data.categories[name] = {
      bg: `bg-${color}-100`,
      border: `border-${color}-400`,
      text: `text-${color}-800`,
      dot: `bg-${color}-500`
    };

    console.log('✅ Category colors updated successfully!\n');
    await this.manageCategories();
  }

  async deleteCategory() {
    console.log('\n🗑️ Delete Category:');
    
    const name = await this.askQuestion('Enter category name to delete: ');
    
    if (!this.data.categories[name]) {
      console.log('❌ Category not found!\n');
      await this.deleteCategory();
      return;
    }

    // Check if any streams use this category
    const streamsUsingCategory = Object.values(this.data.streams).filter(stream => stream.category === name);
    if (streamsUsingCategory.length > 0) {
      console.log(`❌ Cannot delete category "${name}" - it's used by ${streamsUsingCategory.length} stream(s).`);
      console.log('Please reassign or delete those streams first.\n');
      await this.deleteCategory();
      return;
    }

    const confirm = await this.askQuestion(`Are you sure you want to delete category "${name}"? (y/N): `);
    
    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
      delete this.data.categories[name];
      console.log('✅ Category deleted successfully!\n');
    } else {
      console.log('❌ Deletion cancelled.\n');
    }
    
    await this.manageCategories();
  }

  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }
}

// Start the tool
const updater = new StreamScheduleUpdater();
updater.start().catch(console.error);
