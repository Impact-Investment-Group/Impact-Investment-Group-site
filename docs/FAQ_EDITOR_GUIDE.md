# Publishing an approved community question

The public question panel opens an email draft addressed to the existing enquiries mailbox. The visitor sends it using their email app. The copy option is a fallback for opening their own email app; the website does not create an inbox or store the enquiry.

Read and reply privately through the existing enquiries mailbox. Publishing an FAQ is a separate editorial action, never an automatic consequence of receiving a question.

## Prepare the public answer

1. Check the answer against the current service and approved company wording. Keep any personal advice or case-specific response in the private reply.
2. Confirm permission to publish an anonymous question. If the sender did not give permission, request it privately before publishing their question.
3. Rewrite the public question and answer to remove names, contact details, personal circumstances, property addresses, reference numbers and identifying combinations of details. Do this before entering anything into GitHub: workflow inputs and repository history are retained.
4. Use plain text and only the information needed by other readers. No copied email threads, signatures, attachments, credentials, private provider identities or unpublished documents. Automated text checks do not establish permission, accuracy or anonymity.

## Publish without editing code

Open the [FAQ editor workflow](https://github.com/israel-silgram/Impact-Investment-Group-site/actions/workflows/publish-faq.yml), choose **Run workflow**, and keep the branch set to **main**. Repository write access is required.

- **Action:** choose `publish` for a new question.
- **ID:** choose a short unique lowercase slug such as `asking-about-a-property`. Use letters, numbers and single hyphens, begin with a letter, and keep it to 64 characters or fewer.
- **Question:** paste the reviewed anonymous question, up to 240 characters.
- **Answer:** paste the reviewed answer. Separate paragraphs with `||`, for example `First paragraph. || Second paragraph.` Blank lines also work when submitting through the GitHub API. Use no more than eight paragraphs, 2000 characters per paragraph and 12000 characters in total. HTML, code and formatted links are not supported.
- **Approval:** confirm that you have reviewed accuracy, permission to publish and removal of all personal details.

Choose **Run workflow**. The workflow saves the public Q&A in `src/content/faq-community.json` and requests the usual **Deploy to GitHub Pages** checks. Wait for that deployment to succeed, then check the FAQ on the public site. A successful editor run alone does not mean deployment has finished. Submit one editorial change at a time and wait for it to finish before starting the next.

Keep the IDs `what`, `regulated`, `lease`, `residents`, `seeker`, `organisations` and `numbers` for the protected core FAQs. This editor cannot change or remove those answers.

## Correct or remove an answer

Find its exact ID in the [published community FAQ source](https://github.com/israel-silgram/Impact-Investment-Group-site/blob/main/src/content/faq-community.json).

- To correct an answer, choose `update`, reuse the ID, and provide the complete approved question and answer. Existing paragraph text is replaced, not appended.
- To remove an answer, choose `remove`, reuse the ID, and leave question and answer blank. Confirm your review and run the workflow. Removal takes effect after the normal deployment succeeds.

Removing an answer from the website does not erase Git history or past workflow inputs. If personal information was published accidentally, remove it promptly and ask the repository administrator to handle the retained copies.

If the editor rejects a duplicate ID, use `update` or choose another ID. If a change conflicts with another repository edit, the workflow stops without forcing an overwrite. Review the run before retrying. If the FAQ source was saved but deployment failed, run **Deploy to GitHub Pages** from **main** with **source_ref** left blank; fix any failing checks before treating the answer as published.

## Maintainer checks

GitHub Actions runs `node --test scripts/publish-faq.test.mjs`. The read-only command `node scripts/publish-faq.mjs --validate` checks the community source structure and text rules. Normal deployment includes both checks. The editor explicitly dispatches deployment because a commit made with GitHub's workflow token does not start a push workflow.
