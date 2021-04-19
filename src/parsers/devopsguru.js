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
	const createdAt = _.get(message, "StartTime");
	const severity = _.get(message, "InsightSeverity");
	const accountId = _.get(message, "AccountId");
	const region = _.get(message, "Region");

	const dimensions = jmespath.search(event.message, "Anomalies[].SourceDetails[].DataIdentifiers.dimensions")?.map(it => JSON.parse(it))
	let resources = dimensions ? jmespath.search(dimensions, "[].Resource | join(',', @)") : null
	if (!resources)
		resources = JSON.stringify(dimensions);

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

	if (createdAt)
		fields.push({
			title: "CreatedAt",
			value: new Date(createdAt).toUTCString(),
			short: true
		});

	if (resources)
		fields.push({
			title: "Resources",
			value: resources,
			short: false
		})

	if (type === "NEW_INSIGHT") {
		return event.attachmentWithDefaults({
			author_name: "Amazon DevopsGuru",
			fallback: description,
			color: color,
			title: description,
			title_link: url,
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
			title_link: `https://console.aws.amazon.com/devops-guru/home?region=${region}#/insight/reactive/${id}`,
			fields: fields,
			mrkdwn_in: ["title", "text"],
			ts: createdAt,
		})
	}
};
