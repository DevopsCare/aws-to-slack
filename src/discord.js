const AWS = require("aws-sdk")
		, _ = require("lodash");

// Extract the required classes from the discord.js module
const {WebhookClient, WebhookFields} = require('discord.js');

/** The Discord hook URL */
const hookIdPromise = shouldDecryptBlob(process.env.DISCORD_HOOK_ID, s =>
		// URL should be 78-80 characters long when decrypted
		s.length > 100 && !/https?:\/\/\w/.test(s));

const hookTokenPromise = shouldDecryptBlob(process.env.DISCORD_HOOK_TOKEN);


/**
 * Decrypt environment variable if it looks like a KMS encrypted string.
 *
 * @param {string} blob Raw or encrypted base64 value
 * @param {Function} [isValid] Checks whether to attempt to decrypt the value
 * @returns {Promise<string>} Resolved decrypted value, or raw value if fails
 */
function shouldDecryptBlob(blob, isValid) {
	return new Promise(resolve => {
		if (_.isString(blob)
				// encrypted values are usually 250+ characters
				&& blob.length > 50 && !_.includes(blob, " ")
				&& (!isValid || isValid(blob))
		) {
			const kmsClient = new AWS.KMS();
			kmsClient.decrypt({CiphertextBlob: Buffer.from(blob, "base64")}, (err, data) => {
				if (err) {
					console.error("Error decrypting (using as-is):", err);
					resolve(blob);
				} else {
					resolve(data.Plaintext.toString("ascii"));
				}
			});
		} else {
			// use as-is
			resolve(blob);
		}
	});
}


class Discord {
	/**
	 * Posts a message to Discord.
	 *
	 * @param {Object} message - Message to post to Slack
	 * @returns {Promise} Fulfills on success, rejects on error.
	 */
	static postMessage(message) {
		return retry(3, async () => {
			const hookId = await hookIdPromise;
			const hookToken = await hookTokenPromise;
			if (!hookId)
				return null;

			const hook = new WebhookClient(hookId, hookToken);
			const response = await hook.sendSlackMessage(message)
					.catch(err => {
						throw `Discord API error [HTTP:${err.httpStatus}]: ${err.message}`;
					});

			console.info("Message posted successfully.");
			return response;
		});
	}
}

/**
 * Wait for specified number of milliseconds.
 *
 * @param {Number} ms Milliseconds to wait
 * @returns {Promise<any>} _nothing_
 */
function

sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Await function return value repeatedly.
 * Allows Error.retryable=false to override retry behavior.
 *
 * @param {Number} retries Maximum number of times to call function
 * @param {Function} func Function to call
 * @returns {Promise<*>} Return value of function
 */
async function

retry(retries, func) {
	let numTries = 0;
	for (; ;) {
		try {
			return await func();
		} catch (e) {
			if ((_.isUndefined(e.retryable) || e.retryable) && ++numTries < retries) {
				// Exponential back-off
				const waitFor = Math.pow(2, numTries) * 200;
				console.error(`[ERROR-Retryable] attempt#${numTries}, waiting ${waitFor}ms]:`, e);
				await sleep(waitFor);
				continue;
			}
			throw e;
		}
	}
}

module
		.exports = Discord;

