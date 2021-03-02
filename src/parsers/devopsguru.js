//
// AWS DevopsGuru event parser
//
var jmespath = require('jmespath');

exports.matches = event =>
		_.has(event.message, "InsightId");

exports.parse = event => {
	const message = event.message;

	const type = _.get(message, "MessageType");

	if (type === "NEW_RECOMMENDATION"
			|| type === "NEW_ASSOCIATION"
			|| type === "CLOSED_INSIGHT"
	) {
		return true		// not handling yet
	}

	const id = _.get(message, "InsightId");
	const url = _.get(message, "InsightUrl");
	const description = _.get(message, "InsightDescription");
	const createdAt = new Date(_.get(message, "StartTime"));
	const severity = _.get(message, "InsightSeverity");
	const accountId = _.get(message, "AccountId");
	const region = _.get(message, "Region");

	const dimensions = jmespath.search(event.message, "Anomalies[].SourceDetails[].DataIdentifiers.dimensions")?.map(it => JSON.parse(it))
	const resources = dimensions ? jmespath.search(dimensions, "[].Resource | join(',', @)") : null

	const fields = [];

	fields.push({
		title: "Severity",
		value: severity,
		short: true
	});

	let color = event.COLORS.neutral;
	if (severity === 'medium') {
		color = event.COLORS.warning;
	}
	if (severity === 'high') {
		color = event.COLORS.critical;
	}

	fields.push({
		title: "CreatedAt",
		value: createdAt.toUTCString(),
		short: true
	});

	if (resources) {
		fields.push({
			title: "Resources",
			value: resources,
			short: false
		})
	}

	if (type === "NEW_INSIGHT") {
		/* Less noise
				fields.push({
					title: "Account",
					value: accountId,
					short: true
				});

				fields.push({
					title: "Region",
					value: region,
					short: true
				});
		*/
		var mrkdwnDescription = `<${url}|${description}>`

		return event.attachmentWithDefaults({
			author_name: "Amazon DevopsGuru",
			fallback: description,
			color: color,
			title: mrkdwnDescription,
			fields: fields,
			mrkdwn_in: ["title", "text"],
			ts: createdAt,
		})
	}
	if (type === "SEVERITY_UPGRADED") {
		return event.attachmentWithDefaults({
			author_name: "Amazon DevopsGuru",
			fallback: `Severity upgraded to ${severity}`,
			color: color,
			title: `Severity upgraded to ${severity}`,
			fields: fields,
			mrkdwn_in: ["title", "text"],
			ts: createdAt,
		})
	}
};
