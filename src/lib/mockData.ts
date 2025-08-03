interface Character {
  id: string
  name: string
  image?: string
  video?: string
  isSpecial?: boolean
  isCustom?: boolean
  universeId: string
}

export const charactersData: Record<string, Character[]> = {
  'amulet': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'amulet' },
    { id: 'emily-hayes', name: 'Emily Hayes', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/c30e1bde-7eff-4d3c-9f3d-63ac876248ff/options/dc5c8e86-f42d-417a-9aa0-208d61e133f3.png', universeId: 'amulet' },
    { id: 'navin-hayes', name: 'Navin Hayes', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/c30e1bde-7eff-4d3c-9f3d-63ac876248ff/options/747ca391-02cf-443f-a159-f0539fc72bde.png', universeId: 'amulet' },
    { id: 'miskit', name: 'Miskit', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/c30e1bde-7eff-4d3c-9f3d-63ac876248ff/options/d7b3af07-b783-4706-8104-def215ca97df.png', universeId: 'amulet' },
    { id: 'trellis', name: 'Trellis', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/c30e1bde-7eff-4d3c-9f3d-63ac876248ff/options/dcb785d1-6871-4781-bf3d-40d7a0d8c36e.png', universeId: 'amulet' },
    { id: 'leon-redbeard', name: 'Leon Redbeard', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/c30e1bde-7eff-4d3c-9f3d-63ac876248ff/options/b6d73c92-91e3-411a-a8cd-c43ae9780301.png', universeId: 'amulet' },
  ],
  'artemis-fowl': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'artemis-fowl' },
    { id: 'artemis-fowl', name: 'Artemis Fowl', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/38f4a85a-06ee-4501-84df-b1011f54bcc9/options/0987b4d4-6fd9-473e-9b01-25aaa5c27cea.png', universeId: 'artemis-fowl' },
    { id: 'butler', name: 'Butler', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/38f4a85a-06ee-4501-84df-b1011f54bcc9/options/c46c53e4-99ee-4001-ad8a-f6d850dc7f64.png', universeId: 'artemis-fowl' },
    { id: 'holly-short', name: 'Holly Short', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/38f4a85a-06ee-4501-84df-b1011f54bcc9/options/ee5384ee-8583-46f0-89e6-a37085203cda.png', universeId: 'artemis-fowl' },
    { id: 'foaly', name: 'Foaly', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/38f4a85a-06ee-4501-84df-b1011f54bcc9/options/94b83f61-ded3-475c-93ef-51bfa3358e83.png', universeId: 'artemis-fowl' },
    { id: 'mulch-diggums', name: 'Mulch Diggums', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/38f4a85a-06ee-4501-84df-b1011f54bcc9/options/ada99e11-7db9-4c13-8baa-76caba4cd01b.png', universeId: 'artemis-fowl' },
    { id: 'juliet-butler', name: 'Juliet Butler', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/38f4a85a-06ee-4501-84df-b1011f54bcc9/options/efde5a9b-ab91-4139-829d-4dcdd6def4b4.png', universeId: 'artemis-fowl' },
  ],
  'harry-potter': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'harry-potter' },
    { id: 'harry-potter', name: 'Harry Potter', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e284a/options/bdd68db5-b1a7-4885-ae9e-993b3ccee63f.png', universeId: 'harry-potter' },
    { id: 'hermione-granger', name: 'Hermione Granger', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e284a/options/3c652c0f-0f13-4cb1-8bf7-66e825cf16e6.png', universeId: 'harry-potter' },
    { id: 'ron-weasley', name: 'Ron Weasley', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e284a/options/e8fd5f31-c3a6-477e-8e81-eb2c0dd2fbd2.png', universeId: 'harry-potter' },
    { id: 'draco-malfoy', name: 'Draco Malfoy', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e284a/options/c8b19e88-e7f9-4cbd-8a95-bd2da99e88e7.png', universeId: 'harry-potter' },
    { id: 'luna-lovegood', name: 'Luna Lovegood', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e284a/options/11e36c8e-5d09-4e8f-8b49-f7c7e38fa0f1.png', universeId: 'harry-potter' },
    { id: 'neville-longbottom', name: 'Neville Longbottom', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e284a/options/eec1d2cf-91f1-4fa8-bf84-d566cad3c2dc.png', universeId: 'harry-potter' },
    { id: 'ginny-weasley', name: 'Ginny Weasley', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e284a/options/6dc60e48-2b6f-44a5-9af0-af87fb7f8c78.png', universeId: 'harry-potter' },
  ],
  'marvel': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'marvel' },
    { id: 'spider-man', name: 'Spider-Man', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/ed95e3c4-c7ff-4b08-bec4-f948bb6cf16f/options/5ff96bc8-7a09-443f-bcba-fb953cb5ce13.png', universeId: 'marvel' },
    { id: 'iron-man', name: 'Iron Man', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/ed95e3c4-c7ff-4b08-bec4-f948bb6cf16f/options/5b4d8e2f-d088-4f0d-90e9-47a32ad99652.png', universeId: 'marvel' },
    { id: 'captain-america', name: 'Captain America', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/ed95e3c4-c7ff-4b08-bec4-f948bb6cf16f/options/0c76cc5f-83ce-477f-ab5b-3c06da55c80f.png', universeId: 'marvel' },
    { id: 'black-widow', name: 'Black Widow', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/ed95e3c4-c7ff-4b08-bec4-f948bb6cf16f/options/e4ad0c22-c96e-434d-90f5-7dcef2bf40e1.png', universeId: 'marvel' },
    { id: 'hulk', name: 'Hulk', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/ed95e3c4-c7ff-4b08-bec4-f948bb6cf16f/options/fe8a30c9-0b61-481a-821f-c5e8f7c35743.png', universeId: 'marvel' },
    { id: 'thor', name: 'Thor', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/ed95e3c4-c7ff-4b08-bec4-f948bb6cf16f/options/5f92b93e-4e86-48e9-a2b5-cce1b973a61a.png', universeId: 'marvel' },
    { id: 'black-panther', name: 'Black Panther', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/ed95e3c4-c7ff-4b08-bec4-f948bb6cf16f/options/c51c4b8d-e54f-4b7f-8d80-d387cfba5a1c.png', universeId: 'marvel' },
    { id: 'doctor-strange', name: 'Doctor Strange', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/ed95e3c4-c7ff-4b08-bec4-f948bb6cf16f/options/a1a488f5-95ad-4e76-8f83-7a3bc1bc03a5.png', universeId: 'marvel' },
    { id: 'wolverine', name: 'Wolverine', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/ed95e3c4-c7ff-4b08-bec4-f948bb6cf16f/options/d8fb1bf6-de7f-48fe-9c5b-b6d5bb4b2bb2.png', universeId: 'marvel' },
  ],
  'babysitters-club': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'babysitters-club' },
    { id: 'kristy-thomas', name: 'Kristy Thomas', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74502a1c-9ac5-41b0-9b8b-b6f3f668630c/options/ed2f15bc-fa41-480e-83af-a74287164ce5.png', universeId: 'babysitters-club' },
    { id: 'mary-anne-spier', name: 'Mary Anne Spier', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74502a1c-9ac5-41b0-9b8b-b6f3f668630c/options/254f9443-edf0-41f2-a091-9ce87b9f13b9.png', universeId: 'babysitters-club' },
    { id: 'claudia-kishi', name: 'Claudia Kishi', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74502a1c-9ac5-41b0-9b8b-b6f3f668630c/options/21e0f3e9-c7ac-4998-8179-82edf7e18cc6.png', universeId: 'babysitters-club' },
    { id: 'stacey-mcgill', name: 'Stacey McGill', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74502a1c-9ac5-41b0-9b8b-b6f3f668630c/options/37f2edff-2383-4964-a091-ed37060a262d.png', universeId: 'babysitters-club' },
    { id: 'dawn-schafer', name: 'Dawn Schafer', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74502a1c-9ac5-41b0-9b8b-b6f3f668630c/options/5d9a64ec-b809-447d-b247-a05656c659c0.png', universeId: 'babysitters-club' },
    { id: 'mallory-pike', name: 'Mallory Pike', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74502a1c-9ac5-41b0-9b8b-b6f3f668630c/options/733ed733-deae-4656-b109-f2204277e52f.png', universeId: 'babysitters-club' },
    { id: 'jessi-ramsey', name: 'Jessi Ramsey', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74502a1c-9ac5-41b0-9b8b-b6f3f668630c/options/a3b1cc58-f1ac-4841-96a6-4446934d83b9.png', universeId: 'babysitters-club' },
  ],
  'boss-baby': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'boss-baby' },
    { id: 'boss-baby', name: 'Boss Baby', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/4533118b-722e-4aa0-8350-b18b2ad41b47/options/6b12493d-1a80-45a3-9dd9-86536c08eaf7.png', universeId: 'boss-baby' },
    { id: 'tim-templeton', name: 'Tim Templeton', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/4533118b-722e-4aa0-8350-b18b2ad41b47/options/3110fbc1-111e-4066-adbc-1ff8382331b8.png', universeId: 'boss-baby' },
    { id: 'staci', name: 'Staci', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/4533118b-722e-4aa0-8350-b18b2ad41b47/options/d97cfcf1-1207-471d-b023-5a6bebbc6469.png', universeId: 'boss-baby' },
    { id: 'jimbo', name: 'Jimbo', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/4533118b-722e-4aa0-8350-b18b2ad41b47/options/0efd0acf-886a-4606-8f20-f01ea394c122.png', universeId: 'boss-baby' },
  ],
  'dc-comics': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'dc-comics' },
    { id: 'batman', name: 'Batman', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cd029dac-2fde-41da-b41d-a130ec979c99/options/3d395e47-8689-46e3-9f9a-622d81f978f6.png', universeId: 'dc-comics' },
    { id: 'superman', name: 'Superman', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cd029dac-2fde-41da-b41d-a130ec979c99/options/22b8a208-9458-4d13-a415-ab3e6220bb31.png', universeId: 'dc-comics' },
    { id: 'wonder-woman', name: 'Wonder Woman', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cd029dac-2fde-41da-b41d-a130ec979c99/options/80ac9cbe-c9f7-470f-bbd9-ed7f5b7554ee.png', universeId: 'dc-comics' },
    { id: 'aquaman', name: 'Aquaman', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cd029dac-2fde-41da-b41d-a130ec979c99/options/ceed5985-cea1-47ab-8400-db008bf9c55f.png', universeId: 'dc-comics' },
    { id: 'the-flash', name: 'The Flash', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cd029dac-2fde-41da-b41d-a130ec979c99/options/7ccfd7a9-9f93-4603-ba13-984714f7cfb1.png', universeId: 'dc-comics' },
    { id: 'cyborg', name: 'Cyborg', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cd029dac-2fde-41da-b41d-a130ec979c99/options/e9d2bf83-a365-4481-8b0c-4a2f65106e37.png', universeId: 'dc-comics' },
    { id: 'harley-quinn', name: 'Harley Quinn', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cd029dac-2fde-41da-b41d-a130ec979c99/options/9540517d-5e69-4878-9d65-0a52418c8317.png', universeId: 'dc-comics' },
    { id: 'joker', name: 'Joker', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cd029dac-2fde-41da-b41d-a130ec979c99/options/cad52671-fac2-4646-b943-919ffce01102.png', universeId: 'dc-comics' },
    { id: 'lex-luthor', name: 'Lex Luthor', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cd029dac-2fde-41da-b41d-a130ec979c99/options/0714cd5e-a0d6-4a15-9bff-c224f98699ce.png', universeId: 'dc-comics' },
  ],
  'dog-man': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'dog-man' },
    { id: 'dog-man', name: 'Dog Man', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/5bd60d32-c00b-448d-8d59-16d3304c3b39/options/4cf747bc-dfcb-47b8-b9de-d6fa288a8cf7.png', universeId: 'dog-man' },
    { id: 'petey-the-cat', name: 'Petey the Cat', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/5bd60d32-c00b-448d-8d59-16d3304c3b39/options/8da32cb6-f234-4593-8212-bc0aac1d884a.png', universeId: 'dog-man' },
    { id: 'lil-petey', name: "Li'l Petey", image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/5bd60d32-c00b-448d-8d59-16d3304c3b39/options/91124a77-e351-42ee-bd0f-7f6927afa65e.png', universeId: 'dog-man' },
    { id: 'chief', name: 'Chief', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/5bd60d32-c00b-448d-8d59-16d3304c3b39/options/2d7f9fc0-ca21-4f5e-9924-cd0ea2cdce15.png', universeId: 'dog-man' },
    { id: 'sarah-hatoff', name: 'Sarah Hatoff', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/5bd60d32-c00b-448d-8d59-16d3304c3b39/options/c1002483-e635-4ad6-8889-5452a9d8aac1.png', universeId: 'dog-man' },
    { id: '80-hd', name: '80-HD', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/5bd60d32-c00b-448d-8d59-16d3304c3b39/options/35081e29-1eec-4cc3-b00a-8f48fabc8212.png', universeId: 'dog-man' },
  ],
  'dork-diaries': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'dork-diaries' },
    { id: 'nikki-maxwell', name: 'Nikki Maxwell', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/16b8915b-e185-4157-883e-43074d55a827/options/30b53d0c-80f9-4fa3-92c0-693802820672.png', universeId: 'dork-diaries' },
    { id: 'chloe-garcia', name: 'Chloe Garcia', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/16b8915b-e185-4157-883e-43074d55a827/options/c5729ca9-23bb-49cb-8843-35f74de88950.png', universeId: 'dork-diaries' },
    { id: 'zoey-franklin', name: 'Zoey Franklin', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/16b8915b-e185-4157-883e-43074d55a827/options/eaf42b90-1f6b-425f-a7aa-b3dc2fcdb29f.png', universeId: 'dork-diaries' },
    { id: 'brandon-roberts', name: 'Brandon Roberts', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/16b8915b-e185-4157-883e-43074d55a827/options/cbe1a672-0b89-4e09-8428-2fdd9fa4a6d0.png', universeId: 'dork-diaries' },
    { id: 'mackenzie-hollister', name: 'Mackenzie Hollister', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/16b8915b-e185-4157-883e-43074d55a827/options/ffc217dd-ae8f-4644-a5ab-92d93595855b.png', universeId: 'dork-diaries' },
  ],
  'lord-of-the-rings': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'lord-of-the-rings' },
    { id: 'frodo-baggins', name: 'Frodo Baggins', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/5b956b0a-c7f4-456e-85dc-31d9d21bb0f7/options/f016c89f-e21d-46fc-b4f4-f7f1bbd37e78.png', universeId: 'lord-of-the-rings' },
    { id: 'gandalf', name: 'Gandalf', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/5b956b0a-c7f4-456e-85dc-31d9d21bb0f7/options/1f837c06-f073-4bc9-94f0-5c8b89e8b67e.png', universeId: 'lord-of-the-rings' },
    { id: 'aragorn', name: 'Aragorn', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/5b956b0a-c7f4-456e-85dc-31d9d21bb0f7/options/0d960fb1-0fc6-421d-a2ba-2b7dcf899b9e.png', universeId: 'lord-of-the-rings' },
    { id: 'legolas', name: 'Legolas', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/5b956b0a-c7f4-456e-85dc-31d9d21bb0f7/options/2c4ad3f4-0026-4f95-9e14-5a0bb5f3e5ba.png', universeId: 'lord-of-the-rings' },
    { id: 'gimli', name: 'Gimli', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/5b956b0a-c7f4-456e-85dc-31d9d21bb0f7/options/95b20b42-8667-4bb1-beb0-b029c13c7ff4.png', universeId: 'lord-of-the-rings' },
    { id: 'samwise-gamgee', name: 'Samwise Gamgee', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/5b956b0a-c7f4-456e-85dc-31d9d21bb0f7/options/2c2c7d90-a5e2-4cb8-8861-7b08ad44f98e.png', universeId: 'lord-of-the-rings' },
    { id: 'galadriel', name: 'Galadriel', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/5b956b0a-c7f4-456e-85dc-31d9d21bb0f7/options/3a5e8c5f-50cf-4e9f-b32f-5c91e039f1d6.png', universeId: 'lord-of-the-rings' },
  ],
  'mario': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'mario' },
    { id: 'mario', name: 'Mario', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0f38e402-42ca-4d5e-8396-06c124095455/options/69bc9bdb-ebe0-464c-ac38-7ac3f1456e6f.png', universeId: 'mario' },
    { id: 'luigi', name: 'Luigi', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0f38e402-42ca-4d5e-8396-06c124095455/options/9ef2ef39-1cbf-4965-a17b-820d4535d249.png', universeId: 'mario' },
    { id: 'princess-peach', name: 'Princess Peach', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0f38e402-42ca-4d5e-8396-06c124095455/options/31e16040-bcdf-40a8-a8f2-ccc0184e6ddb.png', universeId: 'mario' },
    { id: 'bowser', name: 'Bowser', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0f38e402-42ca-4d5e-8396-06c124095455/options/bcd9ef1d-c9d4-42de-93ab-b60d37792a40.png', universeId: 'mario' },
    { id: 'yoshi', name: 'Yoshi', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0f38e402-42ca-4d5e-8396-06c124095455/options/25553b93-4ace-4f91-bf46-482201ecc41e.png', universeId: 'mario' },
    { id: 'toad', name: 'Toad', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0f38e402-42ca-4d5e-8396-06c124095455/options/c53679db-e1e2-427e-b205-71a8092a1394.png', universeId: 'mario' },
    { id: 'princess-daisy', name: 'Princess Daisy', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/79e1cbde-ba60-49e0-8032-d826dd45c6f3/options/5302e09b-2da9-4ad0-b6f5-f8c91acfdfdc.png', universeId: 'mario' },
    { id: 'bowser-jr', name: 'Bowser Jr.', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/79e1cbde-ba60-49e0-8032-d826dd45c6f3/options/61e2e0f1-fbfb-41f9-92f8-23c94a2ba8f8.png', universeId: 'mario' },
  ],
  'my-hero-academia': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'my-hero-academia' },
    { id: 'izuku-midoriya', name: 'Izuku Midoriya (Deku)', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/c4e25c97-b7fe-4a40-b33f-1f7fd86c8fcb/options/e088f83f-d6fa-4cd8-9ec9-e59d11c3f61f.png', universeId: 'my-hero-academia' },
    { id: 'katsuki-bakugo', name: 'Katsuki Bakugo', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/c4e25c97-b7fe-4a40-b33f-1f7fd86c8fcb/options/46b83265-dcb7-4fa2-8dc1-2dcfce3b7a44.png', universeId: 'my-hero-academia' },
    { id: 'shoto-todoroki', name: 'Shoto Todoroki', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/c4e25c97-b7fe-4a40-b33f-1f7fd86c8fcb/options/de5ebc96-2e8f-4a36-92f9-13b1e9e5a97f.png', universeId: 'my-hero-academia' },
    { id: 'ochako-uraraka', name: 'Ochako Uraraka', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/c4e25c97-b7fe-4a40-b33f-1f7fd86c8fcb/options/c1c4a9f1-79f7-4ff6-b5a0-6bbcad008c66.png', universeId: 'my-hero-academia' },
    { id: 'tenya-iida', name: 'Tenya Iida', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/c4e25c97-b7fe-4a40-b33f-1f7fd86c8fcb/options/c960de18-4358-4c06-a2f5-a7cf8e11e9f9.png', universeId: 'my-hero-academia' },
    { id: 'all-might', name: 'All Might', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/c4e25c97-b7fe-4a40-b33f-1f7fd86c8fcb/options/6cc5df3d-e7f8-4a81-bf28-52f7e956cfcd.png', universeId: 'my-hero-academia' },
    { id: 'eraser-head', name: 'Eraser Head (Aizawa)', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/c4e25c97-b7fe-4a40-b33f-1f7fd86c8fcb/options/e0de2459-e5f7-4b03-885f-7c6d90c5f16d.png', universeId: 'my-hero-academia' },
  ],
  'one-piece': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'one-piece' },
    { id: 'monkey-d-luffy', name: 'Monkey D. Luffy', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0ab83926-d40d-11ef-894d-12e9a65cf12f/options/7e47fad6-d9b3-46bf-836f-a0bc05e6ea8c.png', universeId: 'one-piece' },
    { id: 'roronoa-zoro', name: 'Roronoa Zoro', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0ab83926-d40d-11ef-894d-12e9a65cf12f/options/732a4df6-2895-447f-92a3-ddc5f84deef9.png', universeId: 'one-piece' },
    { id: 'nami', name: 'Nami', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0ab83926-d40d-11ef-894d-12e9a65cf12f/options/1268d3d9-d46a-4096-aae5-05356d9a27f6.png', universeId: 'one-piece' },
    { id: 'sanji', name: 'Sanji', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0ab83926-d40d-11ef-894d-12e9a65cf12f/options/9fccff42-db77-4a80-a066-e637de2be03d.png', universeId: 'one-piece' },
    { id: 'usopp', name: 'Usopp', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0ab83926-d40d-11ef-894d-12e9a65cf12f/options/bd0b32b2-e4b4-47b8-a13d-f6bf1555c932.png', universeId: 'one-piece' },
    { id: 'nico-robin', name: 'Nico Robin', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0ab83926-d40d-11ef-894d-12e9a65cf12f/options/dfd80611-879a-4468-ad37-c584664dbf8a.png', universeId: 'one-piece' },
    { id: 'tony-tony-chopper', name: 'Tony Tony Chopper', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0ab83926-d40d-11ef-894d-12e9a65cf12f/options/4c011adc-ae4e-495a-9a53-8ed417942d40.png', universeId: 'one-piece' },
    { id: 'franky', name: 'Franky', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0ab83926-d40d-11ef-894d-12e9a65cf12f/options/9b03feef-be7a-49b3-a487-f71d7a9138f7.png', universeId: 'one-piece' },
    { id: 'brook', name: 'Brook', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/0ab83926-d40d-11ef-894d-12e9a65cf12f/options/e737da9a-eafe-4766-8f48-3cd0b5b9f0f1.png', universeId: 'one-piece' },
  ],
  'paw-patrol': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'paw-patrol' },
    { id: 'ryder', name: 'Ryder', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74eb2090-6378-4cfd-bde7-c0571f6b66ae/options/32ce5578-b47b-4fdd-8a4d-877c46a0e756.png', universeId: 'paw-patrol' },
    { id: 'chase', name: 'Chase', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74eb2090-6378-4cfd-bde7-c0571f6b66ae/options/492d6216-6acf-4906-b46c-fd52187bc1b4.png', universeId: 'paw-patrol' },
    { id: 'marshall', name: 'Marshall', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74eb2090-6378-4cfd-bde7-c0571f6b66ae/options/f9df9651-8356-4da4-8db2-cb9cbebd5416.png', universeId: 'paw-patrol' },
    { id: 'skye', name: 'Skye', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74eb2090-6378-4cfd-bde7-c0571f6b66ae/options/6e3d9694-9ab2-4f6b-8c65-f6452083d206.png', universeId: 'paw-patrol' },
    { id: 'rocky', name: 'Rocky', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74eb2090-6378-4cfd-bde7-c0571f6b66ae/options/a2b230d7-c4f3-4632-bd59-8a16244ded5b.png', universeId: 'paw-patrol' },
    { id: 'rubble', name: 'Rubble', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74eb2090-6378-4cfd-bde7-c0571f6b66ae/options/0bbcf804-7eea-4e67-bdca-258d227f8936.png', universeId: 'paw-patrol' },
    { id: 'zuma', name: 'Zuma', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74eb2090-6378-4cfd-bde7-c0571f6b66ae/options/e11311d4-b92a-4473-8a35-4c0bc3c3370d.png', universeId: 'paw-patrol' },
    { id: 'everest', name: 'Everest', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/74eb2090-6378-4cfd-bde7-c0571f6b66ae/options/1e3b943b-0a9a-499f-af42-39930b6288ea.png', universeId: 'paw-patrol' },
  ],
  'percy-jackson': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'percy-jackson' },
    { id: 'percy-jackson', name: 'Percy Jackson', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/29b30383-6fad-4e7d-ba22-2ca081eb1372/options/2876fe96-2aab-4a18-9d75-6eca78a8a5ac.png', universeId: 'percy-jackson' },
    { id: 'annabeth-chase', name: 'Annabeth Chase', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/29b30383-6fad-4e7d-ba22-2ca081eb1372/options/303306bd-41c0-44a5-b027-d9e19465563c.png', universeId: 'percy-jackson' },
    { id: 'grover-underwood', name: 'Grover Underwood', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/29b30383-6fad-4e7d-ba22-2ca081eb1372/options/bf393c7e-35b3-4692-b089-1226f05d7904.png', universeId: 'percy-jackson' },
    { id: 'nico-di-angelo', name: 'Nico di Angelo', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/29b30383-6fad-4e7d-ba22-2ca081eb1372/options/2308863d-8840-426f-ae48-a73085f60262.png', universeId: 'percy-jackson' },
    { id: 'clarisse-la-rue', name: 'Clarisse La Rue', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/29b30383-6fad-4e7d-ba22-2ca081eb1372/options/4e117ac5-a4b7-4b2e-8061-a6555339e364.png', universeId: 'percy-jackson' },
    { id: 'thalia-grace', name: 'Thalia Grace', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/29b30383-6fad-4e7d-ba22-2ca081eb1372/options/7f97e5ee-b32d-4cfe-822f-b7bb0f44c1c8.png', universeId: 'percy-jackson' },
    { id: 'tyson', name: 'Tyson', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/29b30383-6fad-4e7d-ba22-2ca081eb1372/options/4aec2d00-345b-4167-ba3d-e76505f3f345.png', universeId: 'percy-jackson' },
    { id: 'chiron', name: 'Chiron', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/29b30383-6fad-4e7d-ba22-2ca081eb1372/options/95c2715c-cece-416d-b1f9-6e5f816999c9.png', universeId: 'percy-jackson' },
  ],
  'pokemon': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'pokemon' },
    { id: 'ash-ketchum', name: 'Ash Ketchum', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/bd5f2f89-0bb3-4d4f-88c1-eef4c582ce0c/options/54292535-bf8d-48fd-9e83-632cae9afda6.png', universeId: 'pokemon' },
    { id: 'pikachu', name: 'Pikachu', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/bd5f2f89-0bb3-4d4f-88c1-eef4c582ce0c/options/d85e8ff2-cc01-4b0c-a2b5-2a949d26cdb7.png', universeId: 'pokemon' },
    { id: 'misty', name: 'Misty', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/bd5f2f89-0bb3-4d4f-88c1-eef4c582ce0c/options/804d2170-4e25-400d-aaec-f68ffa2f5ec7.png', universeId: 'pokemon' },
    { id: 'brock', name: 'Brock', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/bd5f2f89-0bb3-4d4f-88c1-eef4c582ce0c/options/15fbf0d7-e8e2-42e8-96d3-319bf7f61759.png', universeId: 'pokemon' },
    { id: 'charizard', name: 'Charizard', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/bd5f2f89-0bb3-4d4f-88c1-eef4c582ce0c/options/88b084dd-48a7-4c90-962d-2de6a3f7047a.png', universeId: 'pokemon' },
  ],
  'star-wars': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'star-wars' },
    { id: 'luke-skywalker', name: 'Luke Skywalker', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e2810/options/bdd68db5-b1a7-4885-ae9e-993b3ccee700.png', universeId: 'star-wars' },
    { id: 'darth-vader', name: 'Darth Vader', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e2810/options/bdd68db5-b1a7-4885-ae9e-993b3ccee701.png', universeId: 'star-wars' },
    { id: 'leia-organa', name: 'Leia Organa', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e2810/options/bdd68db5-b1a7-4885-ae9e-993b3ccee702.png', universeId: 'star-wars' },
    { id: 'han-solo', name: 'Han Solo', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e2810/options/007a05ee-4a2d-475f-b985-8f153ed7211c.png', universeId: 'star-wars' },
    { id: 'rey', name: 'Rey', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e2810/options/bdd68db5-b1a7-4885-ae9e-993b3ccee703.png', universeId: 'star-wars' },
    { id: 'obi-wan-kenobi', name: 'Obi-Wan Kenobi', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e2810/options/5fdfaf23-1ebd-45a3-a476-c72fe465c948.png', universeId: 'star-wars' },
    { id: 'anakin-skywalker', name: 'Anakin Skywalker', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e2810/options/8c2f37c3-0c74-48b2-97fc-b81977ee41cc.png', universeId: 'star-wars' },
    { id: 'yoda', name: 'Yoda', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/cf5f9117-98f2-4126-ae0e-78f9959e2810/options/6397cf49-af78-4d35-9e2b-03c4ec6f3b7d.png', universeId: 'star-wars' },
  ],
  'narnia': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'narnia' },
    { id: 'peter-pevensie', name: 'Peter Pevensie', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/866348c8-29bd-441a-9e72-f2526d899183/options/87201aeb-9bae-4d66-b762-55e81ddba6c9.png', universeId: 'narnia' },
    { id: 'susan-pevensie', name: 'Susan Pevensie', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/866348c8-29bd-441a-9e72-f2526d899183/options/2c1c704a-4f7d-4b49-ac34-d24172cfa233.png', universeId: 'narnia' },
    { id: 'edmund-pevensie', name: 'Edmund Pevensie', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/866348c8-29bd-441a-9e72-f2526d899183/options/b9244432-12be-415c-a5c1-40e62f2206ad.png', universeId: 'narnia' },
    { id: 'lucy-pevensie', name: 'Lucy Pevensie', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/866348c8-29bd-441a-9e72-f2526d899183/options/a8c151cb-7ad2-45d5-9b22-d1dff751f397.png', universeId: 'narnia' },
    { id: 'prince-caspian', name: 'Prince Caspian', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/866348c8-29bd-441a-9e72-f2526d899183/options/a8a29c9c-85d0-479c-aaa0-109d61e973ba.png', universeId: 'narnia' },
  ],
  'wings-of-fire': [
    { id: 'create-own', name: 'Create Your Choice', isCustom: true, universeId: 'wings-of-fire' },
    { id: 'clay', name: 'Clay', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/d3390988-b264-4c93-850f-866a593936cf/options/6b9db274-4052-45e4-b7e1-4740b96d05f2.png', universeId: 'wings-of-fire' },
    { id: 'tsunami', name: 'Tsunami', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/d3390988-b264-4c93-850f-866a593936cf/options/efe039a9-eff4-4333-a976-12a1bd4d784b.png', universeId: 'wings-of-fire' },
    { id: 'glory', name: 'Glory', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/d3390988-b264-4c93-850f-866a593936cf/options/70acfbc4-fe2c-4776-acd2-c6e9fe0d9946.png', universeId: 'wings-of-fire' },
    { id: 'starflight', name: 'Starflight', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/d3390988-b264-4c93-850f-866a593936cf/options/eff2c765-edb5-4bff-9333-e079fe4b54cf.png', universeId: 'wings-of-fire' },
    { id: 'sunny', name: 'Sunny', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/d3390988-b264-4c93-850f-866a593936cf/options/7e5c7fdb-3646-4743-8617-98af4cd8713d.png', universeId: 'wings-of-fire' },
    { id: 'moonwatcher', name: 'Moonwatcher', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/d3390988-b264-4c93-850f-866a593936cf/options/0e8883fc-eebc-4672-b20b-24c09a01696d.png', universeId: 'wings-of-fire' },
    { id: 'winter', name: 'Winter', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/d3390988-b264-4c93-850f-866a593936cf/options/855dea70-f2aa-4b24-ada2-8c75d5a9eae9.png', universeId: 'wings-of-fire' },
    { id: 'turtle', name: 'Turtle', image: 'https://d3dp0uoydvg1je.cloudfront.net/dilemmas/d3390988-b264-4c93-850f-866a593936cf/options/2d582ace-f153-43ff-9dfe-43bd737208ff.png', universeId: 'wings-of-fire' },
  ],
  // Special characters that appear across all universes
  'special': [
    { id: 'spider-man-special', name: 'Spider-Man', video: 'https://d3dp0uoydvg1je.cloudfront.net/article-attributes/c7dff322-73fe-4dd2-b442-442b56bbaa09.mp4', isSpecial: true, universeId: 'special' },
    { id: 'cinderella', name: 'Cinderella', image: 'https://d3dp0uoydvg1je.cloudfront.net/article-attributes/98e83376-1aac-4640-8f66-466d73a5fce1_1024x585.webp', isSpecial: true, universeId: 'special' },
    { id: 'albert-einstein', name: 'Albert Einstein', image: 'https://d3dp0uoydvg1je.cloudfront.net/article-attributes/ced03bda-a938-43f6-ba0d-a1663c399b76_1024x585.webp', isSpecial: true, universeId: 'special' },
    { id: 'patrick-mahomes', name: 'Patrick Mahomes', image: 'https://d3dp0uoydvg1je.cloudfront.net/article-attributes/42eee9f9-5f8b-44ef-933c-1ac8d076389e_1024x585.webp', isSpecial: true, universeId: 'special' },
  ]
}

// Function to get characters for a specific universe
export function getCharactersForUniverse(universeId: string): Character[] {
  const universeCharacters = charactersData[universeId] || []
  const specialCharacters = charactersData['special'] || []
  
  // Combine special characters with universe-specific characters
  // Special characters appear first after "Create Your Choice"
  const createYourChoice = universeCharacters.find(c => c.isCustom)
  const regularCharacters = universeCharacters.filter(c => !c.isCustom)
  
  return [
    ...(createYourChoice ? [createYourChoice] : []),
    ...specialCharacters,
    ...regularCharacters
  ]
}

// Universe names for dynamic headings
export const universeNames: Record<string, string> = {
  'amulet': 'Amulet',
  'artemis-fowl': 'Artemis Fowl',
  'harry-potter': 'Harry Potter',
  'marvel': 'Marvel',
  'dc-comics': 'DC Comics',
  'star-wars': 'Star Wars',
  'pokemon': 'Pokémon',
  'mario': 'Mario',
  'lord-of-the-rings': 'Lord of the Rings',
  'percy-jackson': 'Percy Jackson',
  'narnia': 'Narnia',
  'my-hero-academia': 'My Hero Academia',
  'one-piece': 'One Piece',
  'paw-patrol': 'Paw Patrol',
  'wings-of-fire': 'Wings of Fire',
  'dork-diaries': 'Dork Diaries',
  'dog-man': 'Dog Man',
  'boss-baby': 'Boss Baby',
  'babysitters-club': "Babysitter's Club"
}