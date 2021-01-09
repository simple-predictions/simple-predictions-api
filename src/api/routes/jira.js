const {createJiraIssue} = require('../../services/jira')

exports.jira = (express) => {
  express.post("/create-jira-issue", (req, res) => {
    const data = req.body
    createJiraIssue(data)
    res.json()
  });
}