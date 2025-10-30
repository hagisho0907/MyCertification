import { parse } from 'csv-parse/sync'
import fs from 'fs'
import path from 'path'

type CsvRow = {
  question_id: string
  question_text: string
  is_multi_answer: string
  [key: string]: string
}

type Choice = {
  id: string
  text: string
  isCorrect: boolean
}

type Question = {
  id: string
  questionText: string
  isMultiAnswer: boolean
  choices: Choice[]
  explanation: string
  referenceLinks: string[]
  tags: string[]
}

type ExamData = {
  examId: string
  title: string
  version: string
  questions: Question[]
  meta: {
    totalQuestions: number
    lastUpdatedAt: string
  }
}

function parseArguments() {
  const args = process.argv.slice(2)
  const params: Record<string, string> = {}
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2)
      params[key] = args[i + 1] || ''
      i++
    }
  }
  
  if (!params.input || !params.output || !params.title || !params.version) {
    console.error('Missing required arguments')
    console.error('Usage: ts-node scripts/convert-csv-to-json.ts --input <csv-path> --output <json-path> --title <title> --version <version>')
    process.exit(1)
  }
  
  return params
}

function convertCsvToJson(csvData: string, title: string, version: string, outputPath: string): ExamData {
  // Remove empty lines from CSV data
  const cleanedCsvData = csvData.split('\n').filter(line => line.trim() !== '').join('\n')
  
  const rows: CsvRow[] = parse(cleanedCsvData, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
  })
  
  const questions: Question[] = []
  const questionIds = new Set<string>()
  
  rows.forEach((row, index) => {
    // Validate required fields
    if (!row.question_id || !row.question_text || !row.is_multi_answer || !row.explanation) {
      throw new Error(`Row ${index + 2}: Missing required fields`)
    }
    
    // Check for duplicate question IDs
    if (questionIds.has(row.question_id)) {
      throw new Error(`Row ${index + 2}: Duplicate question ID: ${row.question_id}`)
    }
    questionIds.add(row.question_id)
    
    // Parse is_multi_answer
    const isMultiAnswer = row.is_multi_answer === 'TRUE'
    if (row.is_multi_answer !== 'TRUE' && row.is_multi_answer !== 'FALSE') {
      throw new Error(`Row ${index + 2}: is_multi_answer must be TRUE or FALSE`)
    }
    
    // Parse choices
    const choices: Choice[] = []
    let correctCount = 0
    
    for (let i = 1; i <= 6; i++) {
      const choiceText = row[`choice_${i}_text`]
      const choiceIsCorrect = row[`choice_${i}_is_correct`]
      
      if (choiceText) {
        const isCorrect = choiceIsCorrect === 'TRUE'
        if (isCorrect) correctCount++
        
        choices.push({
          id: String.fromCharCode(65 + choices.length), // A, B, C...
          text: choiceText,
          isCorrect,
        })
      }
    }
    
    // Validate choices
    if (choices.length === 0) {
      throw new Error(`Row ${index + 2}: No choices found`)
    }
    
    if (correctCount === 0) {
      throw new Error(`Row ${index + 2}: No correct answer marked`)
    }
    
    if (!isMultiAnswer && correctCount > 1) {
      throw new Error(`Row ${index + 2}: Single answer question has multiple correct answers`)
    }
    
    // Parse reference links
    const referenceLinks = row.reference_links
      ? row.reference_links.split(/[,;]/).map(link => link.trim()).filter(Boolean)
      : []
    
    // Parse tags
    const tags = row.tags
      ? row.tags.split(/[,;]/).map(tag => tag.trim()).filter(Boolean)
      : []
    
    questions.push({
      id: row.question_id,
      questionText: row.question_text,
      isMultiAnswer,
      choices,
      explanation: row.explanation,
      referenceLinks,
      tags,
    })
  })
  
  // Extract examId from output path
  const examId = path.basename(outputPath, '.json')
  
  // Determine lastUpdatedAt
  let lastUpdatedAt = new Date().toISOString().split('T')[0]
  if (version.match(/^\d{4}-\d{2}$/)) {
    lastUpdatedAt = `${version}-01`
  }
  
  return {
    examId,
    title,
    version,
    questions,
    meta: {
      totalQuestions: questions.length,
      lastUpdatedAt,
    },
  }
}

async function main() {
  try {
    const args = parseArguments()
    
    console.log(`Converting ${args.input} -> ${args.output}`)
    
    // Read CSV file
    const csvData = fs.readFileSync(args.input, 'utf-8')
    
    // Convert to JSON
    const examData = convertCsvToJson(csvData, args.title, args.version, args.output)
    
    // Write JSON file
    fs.mkdirSync(path.dirname(args.output), { recursive: true })
    fs.writeFileSync(args.output, JSON.stringify(examData, null, 2))
    
    console.log(`✅ Generated ${args.output} (${examData.questions.length} questions)`)
  } catch (error) {
    console.error('ERROR:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()