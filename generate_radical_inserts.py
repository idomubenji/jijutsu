import json

# Load the JSON data
with open('data/radical_data_final.json', 'r', encoding='utf-8') as f:
    radicals = json.load(f)

# Generate SQL file
with open('migrations/02_populate_radical_dex.sql', 'w', encoding='utf-8') as f:
    f.write('-- Populate the radical_dex table with data from radical_data_final.json\n\n')
    
    for radical in radicals:
        dex_number = radical.get('ID', 0)
        radical_number = radical.get('Radical Number', '')
        radical_shape = radical.get('Radical Shape', '')
        english_name = radical.get('English Name', '')
        stroke_count = radical.get('Stroke Count', 0)
        reading = radical.get('Reading', None)
        
        # Handle empty English names by setting a default
        if english_name == '':
            english_name = 'unspecified'
        
        # Create insert statement
        f.write(f"-- Radical {dex_number}\n")
        f.write('INSERT INTO radical_dex (dex_number, radical_number, radical_shape, english_name, stroke_count, reading)\n')
        
        if reading:
            f.write(f"VALUES ({dex_number}, '{radical_number}', '{radical_shape}', '{english_name}', {stroke_count}, '{reading}');\n\n")
        else:
            f.write(f"VALUES ({dex_number}, '{radical_number}', '{radical_shape}', '{english_name}', {stroke_count}, NULL);\n\n") 