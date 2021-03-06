const hash = require("../../hash").get_hash_code;
const assert = require("assert");
const mongoose = require("mongoose");
const timestamps = require('mongoose-timestamp'); // TODO: consider using this for last update time data.
let plans_model, users_model, tasks_model, topics_model;
let is_initialize = false;

let init_plans_schema = async _ => {
    // Define plans schema
    let plans_schema = mongoose.Schema({
        name: {
            type: String,
            required: true
        },
        route: [String],
        description: {
            type: String,
            required: true
        },
        estimated_days: {
            type: Number,
            required: true
        },
        is_active: {
            type: Boolean,
            default: true
        }
    });

    // Create systems model
    plans_model = mongoose.model('plans', plans_schema);
};

let init_topics_schema = async _ => {
    // Define plans schema
    let topics_schema = mongoose.Schema({
        // _id is automatically generated by mongodb
        name: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        is_active: {
            type: Boolean,
            default: true
        },
        dependencies_topics: [String] // Topics ids that should be done before this topic
    });

    // Create systems model
    topics_model = mongoose.model('topics', topics_schema);
};

let init_tasks_schema = async _ => {
    // Define tasks schema
    let tasks_schema = mongoose.Schema({
        // _id is automatically generated by mongodb
        title: {
            type: String,
            required: true
        },
        topic_id: {
            type: String,
            required: true
        },
        inner_topic_order: {
            type: Number,
            required: true
        },
        details: {
            type: String,
            required: true
        },
        search_keywords: [String],
        check_point: {
            type: String,
            enum: ["NONE", "SOFT", "STRONG"],
            default: "NONE"
        },
        answer_type: {
            type: String,
            enum: ["TEXT_STRONG", "TEXT_SOFT", "TEXT_FREE", "FILES", "COMPILATION_RESULT", "BOOLEAN", "MULTIPLE_CHOICES"],
            // Auto Test for: TEXT_STRONG, TEXT_SOFT, COMPILATION_RESULT, BOOLEAN, MULTIPLE_CHOICES
            // No Auto Test for: TEXT_FREE, FILES
            default: "TEXT_FREE"
        },
        file_names: [String],
        answer_options: [String], // For boolean
        code_sections: [
            {
                content: String,
                theme: String,
                language: String
            }
        ],
        judgement_criteria: [String],
        hints: [String],
        plan_exceptions: [
            { // Plan block
                id: {
                    type: String, // Plan ID
                    required: true
                },
                task_progress_value: Number, // if not mentioned -- 1, the number will define how much progress solving this task means to this specific plan (Zero/Positive only numbers)
                details: String,
                search_keywords: [String],
                file_names: [String],
                answer_options: [String],
                code_sections: [String],
                judgement_criteria: [String],
                hints: [String]
            }
        ],
        answer: [String]
    });

    // Create systems model
    tasks_model = mongoose.model('tasks', tasks_schema);
};

let init_users_schema = _ => {
    // Define users schema
    let schema = mongoose.Schema({
        // _id is automatically generated by mongodb
        username: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: Number,
            // 3 -> System Admin    -> Create moderators users.
            // 2 -> Moderator       -> Create/Modify/Remove tasks & plans & members
            // 1 -> Member          -> Submit tasks.
            // 0 -> Banned          -> No access at all.
            default: 1,
            required: true
        },
        register_date: {
            type: Date,
            default: Date.now
        },
        plans: [
            { // plan
                id: {
                    type: String,
                    required: true
                },
                register_date: {
                    type: Date,
                    default: Date.now
                },
                completed_tasks: [
                    {
                        id: {
                            type: String,
                            required: true
                        },
                        answer: [String], // TODO make it required
                        reviewer: { // Reviewer user id || "System" => For auto test
                            type: String,
                            required: true
                        },
                        reviewer_msg: {
                            type: String,
                            required: true
                        },
                        date: {
                            type: Date,
                            default: Date.now
                        }
                    }
                ],
                skipped_tasks: [String],
                tasks_for_review: [
                    {
                        id: {
                            type: String,
                            required: true
                        },
                        answer: [String] // TODO make it required
                    }
                ],
                declined_tasks: [
                    {
                        id: {
                            type: String,
                            required: true
                        },
                        answer: [String], // TODO make it required
                        last_reviewer: { // Reviewer user id || "System" => For auto test
                            type: String,
                            required: true
                        },
                        reviewer_msg: {
                            type: String,
                            required: true
                        },
                        date: {
                            type: Date,
                            default: Date.now
                        }
                    }
                ],
                current_task: {
                    id: {
                        type: String,
                        required: true
                    },
                    status: {
                        type: String,
                        enum: ["In Progress", "Waiting", "In Review", "Completed"], // If completed, this is the last task in the plan
                        default: "In Progress"
                    },
                    answer: [String]
                }
            }
        ]
    });

    // Create versions model
    users_model = mongoose.model('users', schema);

    // If there are no users in db, create an admin user. username = "admin" & password = "admin".
    users_model.find({}).exec((err, data) => {
        if (!data.length) {
            let password = hash("admin");
            let username = "admin";
            let role = 3;
            let new_user = new users_model({
                username: username,
                password: password,
                role: role
            });
            new_user.save((err) => { if (err) throw new Error(err); });
        }
    });
};

let initDB = callback => {
    assert.ok(!is_initialize, "A try to initialize an initialized DB detected.");
    let db_new = mongoose.connect('mongodb://localhost/qualification_plan', {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    });

    console.log("Db connected successfully");

    init_plans_schema();
    init_tasks_schema();
    init_topics_schema();
    init_users_schema();

    is_initialize = true;
    callback();
};

let db_use_pre_conditions = _ => {
    assert.ok(is_initialize, "Db has not been initialized. Please called init first.");
};

let getPlansDBModel = _ => {
    db_use_pre_conditions();
    return plans_model;
};

let getTopicsDBModel = _ => {
    db_use_pre_conditions();
    return topics_model;
};

let getTasksDBModel = _ => {
    db_use_pre_conditions();
    return tasks_model;
};

let getUsersDBModel = _ => {
    db_use_pre_conditions();
    return users_model;
};

module.exports = {
    getDB: _ => {
        return {
            plans_model: getPlansDBModel,
            topics_model: getTopicsDBModel,
            tasks_model: getTasksDBModel,
            users_model: getUsersDBModel
        }
    },
    initDB
};