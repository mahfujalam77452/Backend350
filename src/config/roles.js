const allRoles = {
  user: ['getClubs'],
  moderator: ['getClubs', 'manageClubs', 'getUsers', 'manageEvents', 'getEvents'], // Added getEvents
  admin: ['getUsers', 'manageUsers', 'addClub', 'getClubs', 'manageClubs', 'manageEvents', 'getEvents'], // Added manageEvents & getEvents for completeness
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
