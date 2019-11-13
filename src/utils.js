const loadJsonFile = require('load-json-file')
const isNil = require('lodash/isNil')
const isEmpty = require('lodash/isEmpty')
const boxen = require('boxen')
const path = require('path')
const getReposName = require('git-repo-name')
const fetch = require('node-fetch')
const escapeMarkdown = require('markdown-escape')
const { execSync } = require('child_process')

const END_MSG = `README.md was successfully generated.
Thanks for using readme-md-generator!`

const GITHUB_API_URL = 'https://api.github.com'

const BOXEN_CONFIG = {
  padding: 1,
  margin: { top: 2, bottom: 3 },
  borderColor: 'cyan',
  align: 'center',
  borderStyle: 'double'
}

/**
 * Display end message
 */
const showEndMessage = () => process.stdout.write(boxen(END_MSG, BOXEN_CONFIG))

/**
 * Get package json name property
 *
 * @param {Object} packageJson
 */
const getPackageJsonName = (packageJson = {}) => packageJson.name || undefined
/**
 * Get git repository name
 *
 * @param {String} cwd
 */
const getGitRepositoryName = cwd => {
  try {
    return getReposName.sync({ cwd })
    // eslint-disable-next-line no-empty
  } catch (err) {
    return undefined
  }
}

/**
 * Get project name
 */
const getProjectName = packageJson => {
  const cwd = process.cwd()
  return (
    getPackageJsonName(packageJson) ||
    getGitRepositoryName(cwd) ||
    path.basename(cwd)
  )
}

/**
 * Get package.json content
 */
const getPackageJson = async () => {
  try {
    return await loadJsonFile('package.json')
  } catch (err) {
    return undefined
  }
}

/**
 * Get the default answer depending on the question type
 *
 * @param {Object} question
 */
const getDefaultAnswer = (question, answersContext) => {
  if (question.when && !question.when(answersContext)) return undefined

  switch (question.type) {
    case 'input':
      return question.default || ''
    case 'checkbox':
      return question.choices
        .filter(choice => choice.checked)
        .map(choice => choice.value)
    default:
      return undefined
  }
}

/**
 * Return true if the project is available on NPM, return false otherwise.
 *
 * @param projectName
 * @returns boolean
 */
const isProjectAvailableOnNpm = projectName => {
  try {
    execSync(`npm view ${projectName}`, { stdio: 'ignore' })
    return true
  } catch (err) {
    return false
  }
}

/**
 * Get default question's answers
 *
 * @param {Array} questions
 */
const getDefaultAnswers = questions =>
  questions.reduce(
    (answersContext, question) => ({
      ...answersContext,
      [question.name]: getDefaultAnswer(question, answersContext)
    }),
    {}
  )

/**
 * Clean social network username by removing the @ prefix and
 * escaping markdown characters
 *
 * @param input social network username input
 * @returns {*} escaped input without the prefix
 */
const cleanSocialNetworkUsername = input =>
  escapeMarkdown(input.replace(/^@/, ''))

/**
 * Get author's website from Github API
 *
 * @param {string} githubUsername
 * @returns {string} authorWebsite
 */
const getAuthorWebsiteFromGithubAPI = async githubUsername => {
  try {
    const userData = await fetch(
      `${GITHUB_API_URL}/users/${githubUsername}`
    ).then(res => res.json())
    const authorWebsite = userData.blog
    return isNil(authorWebsite) || isEmpty(authorWebsite)
      ? undefined
      : authorWebsite
  } catch (err) {
    return undefined
  }
}

module.exports = {
  getPackageJson,
  showEndMessage,
  getProjectName,
  END_MSG,
  BOXEN_CONFIG,
  getDefaultAnswers,
  getDefaultAnswer,
  cleanSocialNetworkUsername,
  isProjectAvailableOnNpm,
  getAuthorWebsiteFromGithubAPI
}
