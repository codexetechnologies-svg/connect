import { createSql } from './db.mjs';

// medicine_name, generic_name, brand_name, manufacturer, strength, dosage_form,
// dosage_sub_form, pack_size, unit_of_measure, therapeutic_category, subcategory,
// drug_schedule, dispensing_type, medicine_type, route, storage, ingredients
const rows = [
  ['Paracetamol 650mg Tablet', 'Paracetamol', 'Dolo', 'Micro Labs', '650mg', 'Tablet', 'Film Coated', 'Strip of 15', 'tablets', 'Analgesics', 'Antipyretics', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 25°C', [['Paracetamol', '650mg']]],
  ['Paracetamol 500mg Tablet', 'Paracetamol', 'Crocin', 'GSK', '500mg', 'Tablet', 'Film Coated', 'Strip of 15', 'tablets', 'Analgesics', 'Antipyretics', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 25°C', [['Paracetamol', '500mg']]],
  ['Ibuprofen 400mg Tablet', 'Ibuprofen', 'Brufen', 'Abbott', '400mg', 'Tablet', 'Film Coated', 'Strip of 15', 'tablets', 'Analgesics', 'NSAIDs', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 25°C', [['Ibuprofen', '400mg']]],
  ['Amoxicillin 500mg Capsule', 'Amoxicillin', 'Mox', 'Mankind Pharma', '500mg', 'Capsule', 'Hard Gelatin', 'Strip of 10', 'capsules', 'Antibiotics', 'Penicillins', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 25°C', [['Amoxicillin', '500mg']]],
  ['Azithromycin 500mg Tablet', 'Azithromycin', 'Azee', 'Cipla', '500mg', 'Tablet', 'Film Coated', 'Strip of 3', 'tablets', 'Antibiotics', 'Macrolides', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 25°C', [['Azithromycin', '500mg']]],
  ['Ciprofloxacin 500mg Tablet', 'Ciprofloxacin', 'Cifran', 'Cipla', '500mg', 'Tablet', 'Film Coated', 'Strip of 10', 'tablets', 'Antibiotics', 'Fluoroquinolones', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 25°C', [['Ciprofloxacin', '500mg']]],
  ['Cetirizine 10mg Tablet', 'Cetirizine', 'Alerid', 'Cipla', '10mg', 'Tablet', 'Film Coated', 'Strip of 10', 'tablets', 'Antihistamines', 'Allergy', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 30°C', [['Cetirizine', '10mg']]],
  ['Levocetirizine 5mg Tablet', 'Levocetirizine', 'Levocet', 'Dr Reddy\'s', '5mg', 'Tablet', 'Film Coated', 'Strip of 10', 'tablets', 'Antihistamines', 'Allergy', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 30°C', [['Levocetirizine', '5mg']]],
  ['Pantoprazole 40mg Tablet', 'Pantoprazole', 'Pantocid', 'Sun Pharma', '40mg', 'Tablet', 'Enteric Coated', 'Strip of 10', 'tablets', 'Gastrointestinal', 'PPIs', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 25°C', [['Pantoprazole', '40mg']]],
  ['Omeprazole 20mg Capsule', 'Omeprazole', 'Omez', 'Dr Reddy\'s', '20mg', 'Capsule', 'Enteric', 'Strip of 10', 'capsules', 'Gastrointestinal', 'PPIs', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 25°C', [['Omeprazole', '20mg']]],
  ['Metformin 500mg Tablet', 'Metformin', 'Glycomet', 'USV', '500mg', 'Tablet', 'Film Coated', 'Strip of 10', 'tablets', 'Endocrinology', 'Antidiabetics', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 25°C', [['Metformin', '500mg']]],
  ['Amlodipine 5mg Tablet', 'Amlodipine', 'Amlong', 'Micro Labs', '5mg', 'Tablet', 'Film Coated', 'Strip of 10', 'tablets', 'Cardiovascular', 'Antihypertensives', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 25°C', [['Amlodipine', '5mg']]],
  ['Telmisartan 40mg Tablet', 'Telmisartan', 'Telma', 'Glenmark', '40mg', 'Tablet', 'Film Coated', 'Strip of 15', 'tablets', 'Cardiovascular', 'ARBs', 'H', 'prescription', 'innovator_brand', 'Oral', 'Store below 25°C', [['Telmisartan', '40mg']]],
  ['Atorvastatin 10mg Tablet', 'Atorvastatin', 'Atorva', 'Zydus', '10mg', 'Tablet', 'Film Coated', 'Strip of 10', 'tablets', 'Cardiovascular', 'Statins', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 25°C', [['Atorvastatin', '10mg']]],
  ['Azithromycin 250mg Tablet', 'Azithromycin', null, 'Cipla', '250mg', 'Tablet', 'Film Coated', 'Strip of 6', 'tablets', 'Antibiotics', 'Macrolides', 'H', 'prescription', 'generic', 'Oral', 'Store below 25°C', [['Azithromycin', '250mg']]],
  ['Doxycycline 100mg Capsule', 'Doxycycline', null, 'Aurobindo', '100mg', 'Capsule', 'Hard Gelatin', 'Strip of 10', 'capsules', 'Antibiotics', 'Tetracyclines', 'H', 'prescription', 'generic', 'Oral', 'Store below 25°C', [['Doxycycline', '100mg']]],
  ['ORS Powder Sachet', 'Oral Rehydration Salts', 'Electral', 'FDC', '21.8g', 'Powder', 'Sachet', 'Box of 5', 'sachets', 'Gastrointestinal', 'ORS', '', 'otc', 'branded_generic', 'Oral', 'Store in cool dry place', [['ORS', '21.8g']]],
  ['ORS Powder Sachet', 'Oral Rehydration Salts', null, 'Wallace', '20.5g', 'Powder', 'Sachet', 'Box of 10', 'sachets', 'Gastrointestinal', 'ORS', '', 'otc', 'generic', 'Oral', 'Store in cool dry place', [['ORS', '20.5g']]],
  ['Povidone Iodine 5% Solution 100ml', 'Povidone Iodine', 'Betadine', 'Win-Medicare', '5% w/v', 'Solution', 'Antiseptic', 'Bottle of 100ml', 'ml', 'Antiseptics', 'Topical', 'H', 'prescription', 'branded_generic', 'Topical', 'Store below 30°C', [['Povidone Iodine', '5% w/v']]],
  ['Vitamin D3 60K IU Capsule', 'Cholecalciferol', 'Shelcal', 'Torrent', '60000 IU', 'Capsule', 'Soft Gelatin', 'Strip of 4', 'capsules', 'Vitamins', 'Vitamin D', '', 'otc', 'branded_generic', 'Oral', 'Store below 25°C', [['Cholecalciferol', '60000 IU']]],
  ['Calcium + Vitamin D3 Tablet', 'Calcium Carbonate + Cholecalciferol', 'Shelcal 500', 'Torrent', '500mg + 250IU', 'Tablet', 'Film Coated', 'Strip of 15', 'tablets', 'Vitamins', 'Calcium', '', 'otc', 'branded_generic', 'Oral', 'Store below 25°C', [['Calcium Carbonate', '500mg'], ['Cholecalciferol', '250IU']]],
  ['Multivitamin Syrup 200ml', 'Multivitamins', 'Becosules', 'Pfizer', 'As directed', 'Syrup', 'Syrup', 'Bottle of 200ml', 'ml', 'Vitamins', 'Multivitamin', '', 'otc', 'branded_generic', 'Oral', 'Store below 25°C', [['Multivitamins', 'As directed']]],
  ['Salbutamol Inhaler 100mcg', 'Salbutamol', 'Ventolin', 'GSK', '100mcg', 'Inhaler', 'MDI', '1 inhaler', 'doses', 'Respiratory', 'Bronchodilators', 'H', 'prescription', 'innovator_brand', 'Inhalation', 'Store below 30°C', [['Salbutamol', '100mcg/dose']]],
  ['Insulin Glargine 100IU/ml Injection', 'Insulin Glargine', 'Lantus', 'Sanofi', '100IU/ml', 'Injection', 'Vial', '1 vial of 10ml', 'ml', 'Endocrinology', 'Insulins', 'H1', 'prescription', 'innovator_brand', 'Subcutaneous', 'Store at 2-8°C', [['Insulin Glargine', '100IU/ml']]],
  ['Digene Antacid Gel Mint 200ml', 'Magnesium + Aluminium hydroxide', 'Digene', 'Abbott', 'As directed', 'Gel', 'Gel', 'Bottle of 200ml', 'ml', 'Gastrointestinal', 'Antacids', '', 'otc', 'branded_generic', 'Oral', 'Store below 30°C', [['Magnesium Hydroxide', 'As directed'], ['Aluminium Hydroxide', 'As directed']]],
  ['Cetirizine 5mg Syrup 60ml', 'Cetirizine', null, 'Cipla', '5mg/5ml', 'Syrup', 'Syrup', 'Bottle of 60ml', 'ml', 'Antihistamines', 'Allergy', 'H', 'prescription', 'generic', 'Oral', 'Store below 30°C', [['Cetirizine', '1mg/ml']]],
  ['Nimesulide 100mg Tablet', 'Nimesulide', 'Nimica', 'Ipca', '100mg', 'Tablet', 'Film Coated', 'Strip of 10', 'tablets', 'Analgesics', 'NSAIDs', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 25°C', [['Nimesulide', '100mg']]],
  ['Rabeprazole 20mg Tablet', 'Rabeprazole', 'Rablet', 'Dr Reddy\'s', '20mg', 'Tablet', 'Enteric Coated', 'Strip of 10', 'tablets', 'Gastrointestinal', 'PPIs', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 25°C', [['Rabeprazole', '20mg']]],
  ['Losartan 50mg Tablet', 'Losartan', 'Losar', 'Unichem', '50mg', 'Tablet', 'Film Coated', 'Strip of 10', 'tablets', 'Cardiovascular', 'ARBs', 'H', 'prescription', 'branded_generic', 'Oral', 'Store below 25°C', [['Losartan', '50mg']]],
  ['Glimepiride 1mg Tablet', 'Glimepiride', 'Amaryl', 'Sanofi', '1mg', 'Tablet', 'Film Coated', 'Strip of 10', 'tablets', 'Endocrinology', 'Antidiabetics', 'H', 'prescription', 'innovator_brand', 'Oral', 'Store below 25°C', [['Glimepiride', '1mg']]],
  ['Vitamin B12 Injection 1500mcg', 'Methylcobalamin', 'Methylcobal', 'USV', '1500mcg', 'Injection', 'Vial', '1 vial of 1ml', 'ml', 'Vitamins', 'B-Complex', '', 'prescription', 'branded_generic', 'Intramuscular', 'Store below 25°C', [['Methylcobalamin', '1500mcg/ml']]],
  ['Hydrocortisone Cream 1% 15g', 'Hydrocortisone', 'Cortisol', 'Ochoa', '1% w/w', 'Cream', 'Cream', 'Tube of 15g', 'g', 'Dermatology', 'Steroids', 'H', 'prescription', 'branded_generic', 'Topical', 'Store below 25°C', [['Hydrocortisone', '1% w/w']]]
];

const sql = createSql();
try {
  let inserted = 0;
  for (const r of rows) {
    const [medicineName, genericName, brandName, manufacturer, strength, dosageForm, dosageSubForm, packSize, unit, category, subcategory, schedule, dispensing, mtype, route, storage, ingredients] = r;
    const existing = await sql`
      select id from master_medicines
      where lower(medicine_name) = lower(${medicineName})
        and lower(generic_name) = lower(${genericName})
        and lower(strength) = lower(${strength})
        and lower(dosage_form) = lower(${dosageForm})
        and lower(pack_size) = lower(${packSize})
      limit 1
    `;
    if (existing.length) continue;
    await sql`
      insert into master_medicines (
        medicine_name, generic_name, brand_name, active_ingredients, manufacturer,
        strength, dosage_form, dosage_sub_form, pack_size, unit_of_measure,
        therapeutic_category, subcategory, drug_schedule, dispensing_type,
        medicine_type, route_of_administration, storage_conditions
      ) values (
        ${medicineName}, ${genericName}, ${brandName}, ${sql.json(ingredients)}, ${manufacturer},
        ${strength}, ${dosageForm}, ${dosageSubForm}, ${packSize}, ${unit},
        ${category}, ${subcategory}, ${schedule}, ${dispensing},
        ${mtype}, ${route}, ${storage}
      )
    `;
    inserted++;
  }
  console.log(`Seeded ${inserted} new medicines (${rows.length - inserted} already present).`);
} finally {
  await sql.end();
}
